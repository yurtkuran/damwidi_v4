const marketSnapshotConfig = require('../config/marketSnapshot');
const awsQuote = require('./awsQuote');
const marketDataRepository = require('./marketDataRepository');
const marketSnapshotCache = require('./marketSnapshotCache');
const polygon = require('./polygon');

const normalizeSymbols = (symbols) => [...new Set(symbols.map((symbol) => symbol.trim().toUpperCase()))].sort();

const getNewYorkDateParts = (date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(date);

    return parts.reduce((result, part) => {
        result[part.type] = part.value;
        return result;
    }, {});
};

const classifySession = (marketStatus, date = new Date()) => {
    if (marketStatus.market !== 'open' && marketStatus.earlyHours) {
        return 'premarket';
    }

    if (marketStatus.market === 'open') {
        return 'open';
    }

    if (marketStatus.afterHours || marketStatus.market === 'extended-hours') {
        return 'afterHours';
    }

    const dateParts = getNewYorkDateParts(date);

    if (dateParts.weekday === 'Sat' || dateParts.weekday === 'Sun') {
        return 'weekend';
    }

    const minutes = Number(dateParts.hour) * 60 + Number(dateParts.minute);
    return minutes >= 570 && minutes < 960 ? 'holiday' : 'closed';
};

const getSessionPolicy = (session, config = marketSnapshotConfig) => config.sessionPolicies[session];

const createLogger = () => ({
    error(event, data) {
        console.error(`[marketSnapshot] ${event} ${JSON.stringify(data)}`);
    },
    info(event, data) {
        console.log(`[marketSnapshot] ${event} ${JSON.stringify(data)}`);
    },
});

const createPremarketQuote = (row) => {
    const latestPrice = Number(row['1day']);
    const previousClose = Number(row['2day']);
    const change = latestPrice - previousClose;

    return Object.freeze({
        symbol: row.symbol,
        latestPrice,
        previousClose,
        change,
        changePercent: previousClose === 0 ? 0 : change / previousClose,
        updated: row.previousDate,
        open: null,
        high: null,
        low: null,
        close: latestPrice,
        source: 'database',
    });
};

const normalizeFallbackQuote = (quote, row) => {
    const rowPreviousClose = Number(row && row.previous);
    const previousClose = Number.isFinite(quote.previousClose)
        ? quote.previousClose
        : Number.isFinite(rowPreviousClose)
        ? rowPreviousClose
        : null;
    const change = previousClose === null ? null : quote.latestPrice - previousClose;

    return Object.freeze({
        symbol: quote.symbol,
        latestPrice: quote.latestPrice,
        previousClose,
        change,
        changePercent: previousClose === null ? null : previousClose === 0 ? 0 : change / previousClose,
        updated: quote.updated,
        open: null,
        high: null,
        low: null,
        close: quote.latestPrice,
        source: quote.source,
    });
};

const projectSnapshot = (snapshot, requestedSymbols) => {
    const symbols = requestedSymbols.length === 0 ? snapshot.symbols : requestedSymbols;
    const quotes = new Map();

    for (const symbol of symbols) {
        if (snapshot.quotes.has(symbol)) {
            quotes.set(symbol, snapshot.quotes.get(symbol));
        }
    }

    return {
        quotes,
        symbols: [...symbols],
        marketStatus: snapshot.marketStatus,
        session: snapshot.session,
        fetchedAt: snapshot.fetchedAt,
        expiresAt: snapshot.expiresAt,
        complete: symbols.every((symbol) => quotes.has(symbol)),
        excludedSymbols: symbols.filter((symbol) => !quotes.has(symbol)),
    };
};

const createMarketSnapshotService = (dependencies = {}) => {
    const cache = dependencies.cache || marketSnapshotCache;
    const config = dependencies.config || marketSnapshotConfig;
    const fallbackProvider = Object.prototype.hasOwnProperty.call(dependencies, 'fallbackProvider')
        ? dependencies.fallbackProvider
        : awsQuote;
    const logger = dependencies.logger || createLogger();
    const now = dependencies.now || (() => new Date());
    const provider = dependencies.provider || polygon;
    const repository = dependencies.repository || marketDataRepository;

    const loadMarketStatus = async () => {
        const timestamp = now().getTime();
        const cachedStatus = cache.getMarketStatus(timestamp);

        if (cachedStatus) {
            logger.info('market_status_cache_hit', { age: timestamp - cachedStatus.fetchedAt });
            return cachedStatus.value;
        }

        const existingPromise = cache.getMarketStatusPromise();

        if (existingPromise) {
            logger.info('market_status_coalesced', {});
            return existingPromise;
        }

        let statusPromise;
        statusPromise = (async () => {
            const startedAt = now().getTime();
            const marketStatus = await provider.getMarketStatus();
            const fetchedAt = now().getTime();
            const session = classifySession(marketStatus, now());
            const policy = getSessionPolicy(session, config);
            cache.setMarketStatus(marketStatus, fetchedAt, fetchedAt + policy.marketStatusTTL);
            logger.info('market_status_refresh_complete', {
                session,
                duration: fetchedAt - startedAt,
            });
            return marketStatus;
        })();
        cache.setMarketStatusPromise(statusPromise);

        try {
            return await statusPromise;
        } finally {
            cache.clearMarketStatusPromise(statusPromise);
        }
    };

    const refreshSnapshot = async () => {
        const startedAt = now().getTime();
        const rows = (await repository.getMarketSnapshotRows()).map((row) => ({
            ...row,
            symbol: row.symbol.trim().toUpperCase(),
        }));
        const rowsBySymbol = new Map(rows.map((row) => [row.symbol, row]));
        const symbols = normalizeSymbols([...rowsBySymbol.keys(), ...config.additionalSymbols]);
        const marketStatus = await loadMarketStatus();
        const session = classifySession(marketStatus, now());
        const policy = getSessionPolicy(session, config);
        const quotes = new Map();
        let polygonRequests = 0;
        let fallbackCount = 0;

        if (session === 'premarket') {
            for (const row of rows) {
                quotes.set(row.symbol, createPremarketQuote(row));
            }
        }

        const polygonSymbols = session === 'premarket' ? symbols.filter((symbol) => !quotes.has(symbol)) : symbols;

        if (polygonSymbols.length > 0) {
            const polygonQuotes = await provider.getBatchSnapshots(polygonSymbols);
            polygonRequests++;

            for (const [symbol, quote] of polygonQuotes) {
                quotes.set(symbol, quote);
            }
        }

        const missingSymbols = symbols.filter((symbol) => !quotes.has(symbol));

        if (fallbackProvider && (!fallbackProvider.isConfigured || fallbackProvider.isConfigured())) {
            for (const symbol of missingSymbols) {
                try {
                    const fallbackQuote = await fallbackProvider.quote(symbol);

                    if (fallbackQuote) {
                        quotes.set(symbol, normalizeFallbackQuote(fallbackQuote, rowsBySymbol.get(symbol)));
                        fallbackCount++;
                    }
                } catch (error) {
                    logger.error('fallback_failed', { symbol, message: error.message });
                }
            }
        }

        const fetchedAt = now().getTime();
        const excludedSymbols = symbols.filter((symbol) => !quotes.has(symbol));
        const snapshot = {
            quotes,
            symbols,
            marketStatus,
            session,
            fetchedAt,
            expiresAt: fetchedAt + policy.snapshotTTL,
            complete: excludedSymbols.length === 0,
            excludedSymbols,
        };
        cache.setSnapshot(snapshot);
        logger.info('refresh_complete', {
            session,
            duration: fetchedAt - startedAt,
            symbolCount: symbols.length,
            polygonBatchRequests: polygonRequests,
            fallbackCount,
            excludedSymbols,
        });

        return snapshot;
    };

    const getMarketSnapshot = async (options = {}) => {
        const requestedSymbols = normalizeSymbols(options.symbols || []);
        const timestamp = now().getTime();
        const cachedSnapshot = cache.getSnapshot(timestamp, options.maxAgeMs);

        if (cachedSnapshot) {
            logger.info('cache_hit', {
                age: timestamp - cachedSnapshot.fetchedAt,
                requestedSymbolCount: requestedSymbols.length || cachedSnapshot.symbols.length,
            });
            return projectSnapshot(cachedSnapshot, requestedSymbols);
        }

        const existingPromise = cache.getRefreshPromise();

        if (existingPromise) {
            logger.info('snapshot_coalesced', { requestedSymbolCount: requestedSymbols.length });
            return projectSnapshot(await existingPromise, requestedSymbols);
        }

        logger.info('cache_miss', { requestedSymbolCount: requestedSymbols.length });
        let refreshPromise;
        refreshPromise = refreshSnapshot();
        cache.setRefreshPromise(refreshPromise);

        try {
            return projectSnapshot(await refreshPromise, requestedSymbols);
        } catch (error) {
            logger.error('refresh_failed', { message: error.message });
            throw error;
        } finally {
            cache.clearRefreshPromise(refreshPromise);
        }
    };

    const getQuote = async (symbol, options = {}) => {
        const normalizedSymbol = symbol.toUpperCase();
        const snapshot = await getMarketSnapshot({ ...options, symbols: [normalizedSymbol] });
        return snapshot.quotes.get(normalizedSymbol) || null;
    };

    return {
        getMarketSnapshot,
        getQuote,
    };
};

const marketSnapshotService = createMarketSnapshotService();

module.exports = {
    classifySession,
    createMarketSnapshotService,
    getMarketSnapshot: marketSnapshotService.getMarketSnapshot,
    getQuote: marketSnapshotService.getQuote,
    getSessionPolicy,
};
