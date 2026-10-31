const marketSnapshot = require('./marketSnapshot');
const portfolioRepository = require('./portfolioRepository');
const { phpRound } = require('./marketCalculations');

const requireFiniteNumber = (value, field) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
        throw new Error(`DAM valuation is missing ${field}`);
    }

    return number;
};

const calculateDamQuote = ({ cash, holdings, latestValue, quotes }) => {
    if (!cash) {
        throw new Error('DAM valuation is missing CASH');
    }

    if (!latestValue) {
        throw new Error('DAM valuation is missing the latest data_value row');
    }

    let latestPrice = requireFiniteNumber(cash.basis, 'CASH basis');

    for (const holding of holdings) {
        const symbol = holding.symbol.trim().toUpperCase();
        const quote = quotes.get(symbol);

        if (!quote) {
            throw new Error(`DAM valuation is missing a quote for ${symbol}`);
        }

        latestPrice +=
            requireFiniteNumber(holding.shares, `${symbol} shares`) *
            requireFiniteNumber(quote.latestPrice, `${symbol} latest price`);
    }

    const previousClose =
        requireFiniteNumber(latestValue.bivio_value, 'bivio value') *
        requireFiniteNumber(latestValue.total_shares, 'total shares');
    const change = latestPrice - previousClose;
    const changePercent = previousClose === 0 ? 0 : phpRound(change / previousClose, 4);

    return {
        symbol: 'DAM',
        latestPrice,
        change,
        changePercent,
        previousClose,
    };
};

const createPortfolioValuationService = (dependencies = {}) => {
    const repository = dependencies.repository || portfolioRepository;
    const snapshotService = dependencies.snapshotService || marketSnapshot;

    const getDamQuote = async () => {
        const inputs = await repository.getDamValuationInputs();
        const symbols = inputs.holdings.map((holding) => holding.symbol.trim().toUpperCase());
        const snapshot =
            symbols.length === 0
                ? { quotes: new Map() }
                : await snapshotService.getMarketSnapshot({ symbols });

        return calculateDamQuote({ ...inputs, quotes: snapshot.quotes });
    };

    return {
        getDamQuote,
    };
};

const portfolioValuationService = createPortfolioValuationService();

module.exports = {
    calculateDamQuote,
    createPortfolioValuationService,
    getDamQuote: portfolioValuationService.getDamQuote,
};
