const assert = require('assert');

const marketSnapshotConfig = require('../config/marketSnapshot');
const { createMarketSnapshotService, classifySession } = require('../services/marketSnapshot');
const { createMarketSnapshotCache } = require('../services/marketSnapshotCache');
const polygon = require('../services/polygon');

const ticker = (symbol, current, previous) =>
    Object.freeze({
        symbol,
        latestPrice: current,
        previousClose: previous,
        change: current - previous,
        changePercent: (current - previous) / previous,
        updated: 1,
        open: current,
        high: current,
        low: current,
        close: current,
        source: 'polygon',
    });

const rows = [
    { symbol: 'AAPL', type: 'K', shares: '1', previous: '99', previousDate: '2026-08-27', '1day': '100', '2day': '99' },
    { symbol: 'SPY', type: 'I', shares: '1', previous: '499', previousDate: '2026-08-27', '1day': '500', '2day': '499' },
];

const quietLogger = { info() {}, error() {} };

const restoreEnvironmentVariable = (name, value) => {
    if (value === undefined) {
        delete process.env[name];
        return;
    }

    process.env[name] = value;
};

const testAwsQuote = async () => {
    const originalURL = process.env.AWS_QUOTE_URL;
    const originalKey = process.env.AWS_QUOTE_KEY;
    process.env.AWS_QUOTE_URL = 'https://example.test/';
    process.env.AWS_QUOTE_KEY = 'test-key';

    try {
        delete require.cache[require.resolve('../services/awsQuote')];
        const awsQuote = require('../services/awsQuote');
        const quote = await awsQuote.quote('aapl', {
            async get(url, options) {
                assert.strictEqual(url, 'https://example.test/AAPL');
                assert.strictEqual(options.headers['x-api-key'], 'test-key');
                return { data: { previousClose: '$123.45' } };
            },
        });
        assert.deepStrictEqual(quote, {
            symbol: 'AAPL',
            latestPrice: 123.45,
            previousClose: 123.45,
            updated: null,
            source: 'yahoo',
        });
    } finally {
        restoreEnvironmentVariable('AWS_QUOTE_URL', originalURL);
        restoreEnvironmentVariable('AWS_QUOTE_KEY', originalKey);
        delete require.cache[require.resolve('../services/awsQuote')];
    }
};

const testPolygonService = async () => {
    const calls = [];
    const httpClient = {
        async get(url, options) {
            calls.push({ url, options });

            if (url.endsWith('/v1/marketstatus/now')) {
                return { data: { market: 'open' } };
            }

            return {
                data: {
                    tickers: [
                        {
                            ticker: 'AAPL',
                            day: { o: 100, h: 103, l: 99, c: 102 },
                            prevDay: { o: 98, h: 101, l: 97, c: 99 },
                            todaysChange: 3,
                            todaysChangePerc: 3.030303,
                            updated: 1000000000,
                        },
                    ],
                },
            };
        },
    };

    const status = await polygon.getMarketStatus(httpClient);
    const quotes = await polygon.getBatchSnapshots(['aapl', 'AAPL'], httpClient);
    assert.strictEqual(status.market, 'open');
    assert.strictEqual(calls.length, 2);
    assert.strictEqual(calls[1].options.params.tickers, 'AAPL');
    assert.deepStrictEqual(quotes.get('AAPL'), {
        symbol: 'AAPL',
        latestPrice: 102,
        previousClose: 99,
        change: 3,
        changePercent: 3.030303 / 100,
        updated: 1,
        open: 100,
        high: 103,
        low: 99,
        close: 102,
        source: 'polygon',
    });
};

const testCacheAndConcurrency = async () => {
    let timestamp = new Date('2026-08-28T15:00:00.000Z').getTime();
    let statusCalls = 0;
    let batchCalls = 0;
    const provider = {
        async getMarketStatus() {
            statusCalls++;
            return { market: 'open', earlyHours: false, afterHours: false };
        },
        async getBatchSnapshots(symbols) {
            batchCalls++;
            await new Promise((resolve) => setTimeout(resolve, 5));
            return new Map(symbols.map((symbol, index) => [symbol, ticker(symbol, 100 + index, 99 + index)]));
        },
    };
    const service = createMarketSnapshotService({
        cache: createMarketSnapshotCache(),
        config: { ...marketSnapshotConfig, additionalSymbols: ['SPY'] },
        fallbackProvider: null,
        logger: quietLogger,
        now: () => new Date(timestamp),
        provider,
        repository: { async getMarketSnapshotRows() { return rows; } },
    });

    const requests = Array.from({ length: 10 }, () => service.getMarketSnapshot());
    const snapshots = await Promise.all(requests);
    assert.strictEqual(statusCalls, 1);
    assert.strictEqual(batchCalls, 1);
    assert.strictEqual(snapshots[0].quotes.size, 2);

    const cached = await service.getMarketSnapshot({ symbols: ['AAPL'], maxAgeMs: 10 });
    assert.strictEqual(statusCalls, 1);
    assert.strictEqual(batchCalls, 1);
    assert.deepStrictEqual([...cached.quotes.keys()], ['AAPL']);
    cached.quotes.set('MUTATED', ticker('MUTATED', 1, 1));
    const unchanged = await service.getMarketSnapshot();
    assert.strictEqual(unchanged.quotes.has('MUTATED'), false);

    timestamp += marketSnapshotConfig.sessionPolicies.open.snapshotTTL + 1;
    await service.getMarketSnapshot();
    assert.strictEqual(statusCalls, 1);
    assert.strictEqual(batchCalls, 2);

    assert.strictEqual(classifySession({ market: 'open', earlyHours: false, afterHours: false }, new Date(timestamp)), 'open');
    assert.strictEqual(classifySession({ market: 'closed', earlyHours: true, afterHours: false }, new Date(timestamp)), 'premarket');
    assert.strictEqual(classifySession({ market: 'extended-hours', earlyHours: false, afterHours: true }, new Date(timestamp)), 'afterHours');
    assert.strictEqual(
        classifySession({ market: 'closed', earlyHours: false, afterHours: false }, new Date('2026-08-29T16:00:00.000Z')),
        'weekend'
    );
    assert.strictEqual(
        classifySession({ market: 'closed', earlyHours: false, afterHours: false }, new Date('2026-12-25T17:00:00.000Z')),
        'holiday'
    );
};

const testSessionTTLPolicies = async () => {
    const cases = [
        {
            session: 'open',
            timestamp: '2026-08-28T15:00:00.000Z',
            marketStatus: { market: 'open', earlyHours: false, afterHours: false },
        },
        {
            session: 'premarket',
            timestamp: '2026-08-28T12:00:00.000Z',
            marketStatus: { market: 'closed', earlyHours: true, afterHours: false },
        },
        {
            session: 'afterHours',
            timestamp: '2026-08-28T21:00:00.000Z',
            marketStatus: { market: 'closed', earlyHours: false, afterHours: true },
        },
        {
            session: 'closed',
            timestamp: '2026-08-28T21:00:00.000Z',
            marketStatus: { market: 'closed', earlyHours: false, afterHours: false },
        },
        {
            session: 'weekend',
            timestamp: '2026-08-29T16:00:00.000Z',
            marketStatus: { market: 'closed', earlyHours: false, afterHours: false },
        },
        {
            session: 'holiday',
            timestamp: '2026-12-25T17:00:00.000Z',
            marketStatus: { market: 'closed', earlyHours: false, afterHours: false },
        },
    ];

    for (const testCase of cases) {
        let timestamp = new Date(testCase.timestamp).getTime();
        let batchCalls = 0;
        let repositoryCalls = 0;
        const policy = marketSnapshotConfig.sessionPolicies[testCase.session];
        const service = createMarketSnapshotService({
            cache: createMarketSnapshotCache(),
            config: { ...marketSnapshotConfig, additionalSymbols: ['DIA'] },
            fallbackProvider: null,
            logger: quietLogger,
            now: () => new Date(timestamp),
            provider: {
                async getMarketStatus() {
                    return testCase.marketStatus;
                },
                async getBatchSnapshots(symbols) {
                    batchCalls++;
                    return new Map(symbols.map((symbol, index) => [symbol, ticker(symbol, 100 + index, 99 + index)]));
                },
            },
            repository: {
                async getMarketSnapshotRows() {
                    repositoryCalls++;
                    return rows;
                },
            },
        });

        const first = await service.getMarketSnapshot();
        assert.strictEqual(first.session, testCase.session);
        assert.strictEqual(batchCalls, 1);
        assert.strictEqual(repositoryCalls, 1);

        timestamp += policy.snapshotTTL - 1;
        const cached = await service.getMarketSnapshot();
        assert.strictEqual(cached.fetchedAt, first.fetchedAt);
        assert.strictEqual(batchCalls, 1);
        assert.strictEqual(repositoryCalls, 1);

        timestamp += 2;
        const refreshed = await service.getMarketSnapshot();
        assert.notStrictEqual(refreshed.fetchedAt, first.fetchedAt);
        assert.strictEqual(batchCalls, 2);
        assert.strictEqual(repositoryCalls, 2);
    }
};

const testPremarketAndFallback = async () => {
    const premarketService = createMarketSnapshotService({
        cache: createMarketSnapshotCache(),
        config: { ...marketSnapshotConfig, additionalSymbols: ['SPY'] },
        fallbackProvider: null,
        logger: quietLogger,
        now: () => new Date('2026-08-28T12:00:00.000Z'),
        provider: {
            async getMarketStatus() {
                return { market: 'closed', earlyHours: true, afterHours: false };
            },
            async getBatchSnapshots() {
                throw new Error('tracked premarket rows must not call Polygon snapshots');
            },
        },
        repository: { async getMarketSnapshotRows() { return rows; } },
    });
    const premarket = await premarketService.getMarketSnapshot();
    assert.strictEqual(premarket.session, 'premarket');
    assert.strictEqual(premarket.quotes.get('AAPL').latestPrice, 100);
    assert.strictEqual(premarket.quotes.get('AAPL').previousClose, 99);
    assert.strictEqual(premarket.quotes.get('AAPL').source, 'database');

    let fallbackCalls = 0;
    const fallbackService = createMarketSnapshotService({
        cache: createMarketSnapshotCache(),
        config: { ...marketSnapshotConfig, additionalSymbols: ['SPY'] },
        fallbackProvider: {
            isConfigured: () => true,
            async quote(symbol) {
                fallbackCalls++;
                return { symbol, latestPrice: 101, previousClose: null, updated: 1, source: 'yahoo' };
            },
        },
        logger: quietLogger,
        now: () => new Date('2026-08-28T15:00:00.000Z'),
        provider: {
            async getMarketStatus() {
                return { market: 'open', earlyHours: false, afterHours: false };
            },
            async getBatchSnapshots() {
                return new Map([['SPY', ticker('SPY', 500, 499)]]);
            },
        },
        repository: { async getMarketSnapshotRows() { return rows; } },
    });
    const fallbackRequests = [
        fallbackService.getMarketSnapshot({ symbols: ['AAPL'] }),
        fallbackService.getMarketSnapshot({ symbols: ['SPY'] }),
        ...Array.from({ length: 8 }, () => fallbackService.getMarketSnapshot()),
    ];
    const fallbackSnapshots = await Promise.all(fallbackRequests);
    const fallback = fallbackSnapshots[0];
    assert.strictEqual(fallbackCalls, 1);
    assert.strictEqual(fallback.complete, true);
    assert.strictEqual(fallback.quotes.get('AAPL').source, 'yahoo');
    assert.strictEqual(fallback.quotes.get('AAPL').previousClose, 99);
    assert.strictEqual(new Set(fallbackSnapshots.map((snapshot) => snapshot.fetchedAt)).size, 1);
};

const testFailureRetry = async () => {
    let attempts = 0;
    const service = createMarketSnapshotService({
        cache: createMarketSnapshotCache(),
        config: { ...marketSnapshotConfig, additionalSymbols: ['SPY'] },
        fallbackProvider: null,
        logger: quietLogger,
        now: () => new Date('2026-08-28T15:00:00.000Z'),
        provider: {
            async getMarketStatus() {
                return { market: 'open', earlyHours: false, afterHours: false };
            },
            async getBatchSnapshots(symbols) {
                attempts++;

                if (attempts === 1) {
                    throw new Error('temporary provider failure');
                }

                return new Map(symbols.map((symbol, index) => [symbol, ticker(symbol, 100 + index, 99 + index)]));
            },
        },
        repository: { async getMarketSnapshotRows() { return rows; } },
    });

    await assert.rejects(service.getMarketSnapshot(), /temporary provider failure/);
    const retry = await service.getMarketSnapshot();
    assert.strictEqual(attempts, 2);
    assert.strictEqual(retry.complete, true);
};

const run = async () => {
    await testAwsQuote();
    await testPolygonService();
    await testCacheAndConcurrency();
    await testSessionTTLPolicies();
    await testPremarketAndFallback();
    await testFailureRetry();

    console.log('market snapshot tests passed');
};

run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
