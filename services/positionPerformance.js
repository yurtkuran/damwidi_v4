const marketSnapshot = require('./marketSnapshot');
const portfolioRepository = require('./portfolioRepository');
const { phpRound } = require('./marketCalculations');

const getNewYorkDate = (date = new Date()) => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

    return `${values.year}-${values.month}-${values.day}`;
};

const replayPosition = (transactions) => {
    const basisByDate = new Map();
    let position = null;

    for (const transaction of transactions) {
        const date = String(transaction.transaction_date);

        if (transaction.type === 'B') {
            if (!position) {
                position = { shares: 0, purchases: [] };
            }

            position.shares += Number(transaction.shares);
            position.purchases.push(date);
            if (!basisByDate.has(date)) {
                basisByDate.set(date, Number(transaction.price));
            }
        } else if (transaction.type === 'S' && position) {
            position.shares += Number(transaction.shares);
        }

        if (position && phpRound(position.shares, 5) === 0) {
            position = null;
        }
    }

    return position ? { basisByDate, purchases: position.purchases } : null;
};

const applySplits = (price, purchaseDate, splits, throughDate) => {
    let adjustedPrice = Number(price);

    for (const split of splits) {
        const splitDate = String(split.date);
        const splitFrom = Number(split.split_from);
        const splitTo = Number(split.split_to);

        if (!Number.isFinite(splitFrom) || !Number.isFinite(splitTo) || splitFrom === 0 || splitTo === 0) {
            throw new Error(`Position performance has an invalid split ratio on ${splitDate}`);
        }

        if (purchaseDate <= splitDate && throughDate >= splitDate) {
            adjustedPrice /= splitTo / splitFrom;
        }
    }

    return adjustedPrice;
};

const calculateGain = (current, basis) => {
    return basis === 0 ? 0 : phpRound((100 * (current - basis)) / basis, 2);
};

const buildPositionPerformance = ({
    symbol,
    position,
    splits,
    spyHistory,
    symbolQuote,
    spyQuote,
    previousClose,
    throughDate,
}) => {
    const spyByDate = new Map(spyHistory.map((row) => [String(row.date), Number(row.close)]));
    const purchases = position.purchases.map((dateBasis) => {
        if (!position.basisByDate.has(dateBasis)) {
            throw new Error(`Position performance is missing a purchase basis for ${symbol} on ${dateBasis}`);
        }

        if (!spyByDate.has(dateBasis) || !Number.isFinite(spyByDate.get(dateBasis))) {
            throw new Error(`Position performance is missing SPY history for ${dateBasis}`);
        }

        const adjustedBasis = applySplits(position.basisByDate.get(dateBasis), dateBasis, splits, throughDate);
        const spyBasis = spyByDate.get(dateBasis);

        return {
            dateBasis,
            priceBasis: phpRound(adjustedBasis, 2),
            priceGain: calculateGain(symbolQuote.latestPrice, adjustedBasis),
            spyGain: calculateGain(spyQuote.latestPrice, spyBasis),
        };
    });

    return {
        symbol,
        priceLast: Number(symbolQuote.latestPrice),
        pricePreviousClose: Number(previousClose),
        purchases,
    };
};

const createPositionPerformanceService = (dependencies = {}) => {
    const now = dependencies.now || (() => new Date());
    const repository = dependencies.repository || portfolioRepository;
    const snapshotService = dependencies.snapshotService || marketSnapshot;

    const getPositionPerformance = async (requestedSymbol) => {
        const symbol = requestedSymbol.trim().toUpperCase();
        const throughDate = getNewYorkDate(now());
        const transactions = await repository.getPositionTransactions(symbol, throughDate);
        const position = replayPosition(transactions);

        if (!position) {
            return null;
        }

        const purchaseDates = [...new Set(position.purchases)];
        const [splits, spyHistory, previousCloseRow, snapshot] = await Promise.all([
            repository.getPositionSplits(symbol),
            repository.getHistoricalCloses('SPY', purchaseDates),
            repository.getPositionPreviousClose(symbol),
            snapshotService.getMarketSnapshot({ symbols: [...new Set([symbol, 'SPY'])] }),
        ]);
        const symbolQuote = snapshot.quotes.get(symbol);
        const spyQuote = snapshot.quotes.get('SPY');
        const previousClose =
            snapshot.session === 'premarket'
                ? previousCloseRow && previousCloseRow['2day']
                : previousCloseRow && previousCloseRow.previous;

        if (!symbolQuote || !Number.isFinite(Number(symbolQuote.latestPrice))) {
            throw new Error(`Position performance is missing a current quote for ${symbol}`);
        }

        if (!spyQuote || !Number.isFinite(Number(spyQuote.latestPrice))) {
            throw new Error('Position performance is missing a current quote for SPY');
        }

        if (previousClose === null || previousClose === undefined || !Number.isFinite(Number(previousClose))) {
            throw new Error(`Position performance is missing a previous close for ${symbol}`);
        }

        return buildPositionPerformance({
            symbol,
            position,
            splits,
            spyHistory,
            symbolQuote,
            spyQuote,
            previousClose,
            throughDate,
        });
    };

    return {
        getPositionPerformance,
    };
};

const positionPerformanceService = createPositionPerformanceService();

module.exports = {
    applySplits,
    buildPositionPerformance,
    calculateGain,
    createPositionPerformanceService,
    getNewYorkDate,
    getPositionPerformance: positionPerformanceService.getPositionPerformance,
    replayPosition,
};
