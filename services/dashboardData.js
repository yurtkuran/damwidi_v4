const { buildAllocationData } = require('./allocation');
const marketDataRepository = require('./marketDataRepository');
const { phpRound } = require('./marketCalculations');
const marketSnapshot = require('./marketSnapshot');
const portfolioRepository = require('./portfolioRepository');
const { calculateDamQuote } = require('./portfolioValuation');

const requireNumber = (value, field) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(`Dashboard data is missing ${field}`);
    }

    return number;
};

const getQuote = (quotes, symbol) => {
    const quote = quotes.get(symbol);

    if (!quote) {
        throw new Error(`Dashboard data is missing a quote for ${symbol}`);
    }

    return quote;
};

const calculateGain = (quote, symbol) => {
    const latestPrice = requireNumber(quote.latestPrice, `${symbol} latest price`);
    const previousClose = requireNumber(quote.previousClose, `${symbol} previous close`);

    return previousClose === 0 ? 0 : phpRound((100 * (latestPrice - previousClose)) / previousClose, 2);
};

const buildIndexQuote = (quote, symbol) => ({
    symbol,
    latestPrice: requireNumber(quote.latestPrice, `${symbol} latest price`),
    change: requireNumber(quote.change, `${symbol} change`),
    changePercent: requireNumber(quote.changePercent, `${symbol} change percent`),
    previousClose: requireNumber(quote.previousClose, `${symbol} previous close`),
});

const buildDashboardData = ({ baseRows, latestValue, snapshot, stockMappings, stockRows }) => {
    const allocation = buildAllocationData({ baseRows, snapshot, stockMappings, stockRows });
    const trackedRows = [...baseRows.filter((row) => row.type !== 'C'), ...stockRows];
    const cash = baseRows.find((row) => row.type === 'C' && row.symbol === 'CASH') || null;
    const holdings = trackedRows.filter((row) => requireNumber(row.shares, `${row.symbol} shares`) !== 0);
    const fundQuote = calculateDamQuote({ cash, holdings, latestValue, quotes: snapshot.quotes });
    const movers = trackedRows.map((row) => {
        const quote = getQuote(snapshot.quotes, row.symbol);

        return {
            symbol: row.symbol,
            gain: calculateGain(quote, row.symbol),
            held: requireNumber(row.shares, `${row.symbol} shares`) > 0,
        };
    });

    movers.push({
        symbol: 'DAM',
        gain: fundQuote.previousClose === 0 ? 0 : phpRound(100 * fundQuote.changePercent, 2),
        held: true,
    });
    movers.sort((left, right) => right.gain - left.gain);

    const positions = holdings
        .map((row) => {
            const quote = getQuote(snapshot.quotes, row.symbol);
            const previousClose = snapshot.session === 'premarket' ? row['2day'] : row.previous;

            return {
                symbol: row.symbol,
                description: row.description,
                basis: requireNumber(row.basis, `${row.symbol} basis`),
                shares: requireNumber(row.shares, `${row.symbol} shares`),
                previousClose: requireNumber(previousClose, `${row.symbol} stored previous close`),
                last: requireNumber(quote.latestPrice, `${row.symbol} latest price`),
                gain: calculateGain(quote, row.symbol),
            };
        })
        .sort((left, right) => right.gain - left.gain);

    const allocationNames = new Map([...baseRows, ...stockRows].map((row) => [row.symbol, row.name || row.description]));
    const allocationSummary = allocation.rows
        .filter((row) => ['C', 'I', 'Y'].includes(row.type))
        .map((row) => ({
            symbol: row.symbol,
            name: allocationNames.get(row.sector) || row.description,
            type: row.type,
            allocation: row.allocation,
            ...(row.impliedPercent === undefined ? {} : { impliedPercent: row.impliedPercent }),
        }));

    const indexQuotes = {
        DAM: fundQuote,
        SPY: buildIndexQuote(getQuote(snapshot.quotes, 'SPY'), 'SPY'),
        QQQ: buildIndexQuote(getQuote(snapshot.quotes, 'QQQ'), 'QQQ'),
        DIA: buildIndexQuote(getQuote(snapshot.quotes, 'DIA'), 'DIA'),
    };

    return {
        asOf: new Date(snapshot.fetchedAt).toISOString(),
        fundQuote,
        indexQuotes,
        movers,
        allocationSummary,
        positions,
        dataQuality: {
            complete: snapshot.complete,
            excludedSymbols: [...snapshot.excludedSymbols],
        },
    };
};

const projectDashboardData = (dashboardData, isMember) => ({
    ...dashboardData,
    positions: isMember ? dashboardData.positions : [],
});

const createDashboardDataService = (dependencies = {}) => {
    const repository = dependencies.repository || marketDataRepository;
    const snapshotService = dependencies.snapshotService || marketSnapshot;
    const valuationRepository = dependencies.valuationRepository || portfolioRepository;

    const getDashboardData = async () => {
        const [inputs, latestValue, snapshot] = await Promise.all([
            repository.getAllocationInputs(),
            valuationRepository.getLatestDamValue(),
            snapshotService.getMarketSnapshot(),
        ]);

        return buildDashboardData({ ...inputs, latestValue, snapshot });
    };

    return { getDashboardData };
};

const dashboardDataService = createDashboardDataService();

module.exports = {
    buildDashboardData,
    createDashboardDataService,
    getDashboardData: dashboardDataService.getDashboardData,
    projectDashboardData,
};
