const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { getDamValuationInputs } = require('../services/portfolioRepository');
const { calculateDamQuote, createPortfolioValuationService } = require('../services/portfolioValuation');

const valuationInputs = {
    cash: { symbol: 'CASH', type: 'C', shares: '1.00000', basis: '100.000' },
    holdings: [
        { symbol: 'AAPL', type: 'K', shares: '2.00000', basis: '10.000' },
        { symbol: 'SPY', type: 'I', shares: '3.00000', basis: '20.000' },
    ],
    latestValue: {
        date: '2026-10-30',
        total_shares: '18.000000',
        share_value: '10.000000',
        bivio_value: '10.000000',
    },
};

const quotes = new Map([
    ['AAPL', { symbol: 'AAPL', latestPrice: 12.5 }],
    ['SPY', { symbol: 'SPY', latestPrice: 20 }],
]);

const testRepository = async () => {
    const queries = [];
    const database = {
        async query(sql, options) {
            queries.push({ sql, options });

            if (sql.includes('FROM data_performance')) {
                return [valuationInputs.cash, ...valuationInputs.holdings];
            }

            return [valuationInputs.latestValue];
        },
    };

    const result = await getDamValuationInputs(database);

    assert.strictEqual(queries.length, 2);
    assert.match(queries[0].sql, /shares <> 0/);
    assert.match(queries[1].sql, /ORDER BY date DESC/);
    assert.strictEqual(result.cash.symbol, 'CASH');
    assert.deepStrictEqual(result.holdings.map((holding) => holding.symbol), ['AAPL', 'SPY']);
    assert.strictEqual(result.latestValue.date, '2026-10-30');
};

const testCalculation = () => {
    assert.deepStrictEqual(calculateDamQuote({ ...valuationInputs, quotes }), {
        symbol: 'DAM',
        latestPrice: 185,
        change: 5,
        changePercent: 0.0278,
        previousClose: 180,
    });
};

const testServiceComposition = async () => {
    const requestedSymbols = [];
    const service = createPortfolioValuationService({
        repository: {
            async getDamValuationInputs() {
                return valuationInputs;
            },
        },
        snapshotService: {
            async getMarketSnapshot(options) {
                requestedSymbols.push(options.symbols);
                return { quotes };
            },
        },
    });

    const result = await service.getDamQuote();

    assert.deepStrictEqual(requestedSymbols, [['AAPL', 'SPY']]);
    assert.strictEqual(result.symbol, 'DAM');
    assert.strictEqual(result.latestPrice, 185);
};

const testCashOnlyPortfolioSkipsMarketProvider = async () => {
    const service = createPortfolioValuationService({
        repository: {
            async getDamValuationInputs() {
                return {
                    cash: valuationInputs.cash,
                    holdings: [],
                    latestValue: valuationInputs.latestValue,
                };
            },
        },
        snapshotService: {
            async getMarketSnapshot() {
                throw new Error('market snapshot should not be requested for a cash-only portfolio');
            },
        },
    });

    const result = await service.getDamQuote();
    assert.strictEqual(result.latestPrice, 100);
};

const testMissingInputs = () => {
    assert.throws(
        () => calculateDamQuote({ ...valuationInputs, quotes: new Map([['AAPL', quotes.get('AAPL')]]) }),
        /missing a quote for SPY/
    );
    assert.throws(() => calculateDamQuote({ ...valuationInputs, cash: null, quotes }), /missing CASH/);
    assert.throws(() => calculateDamQuote({ ...valuationInputs, latestValue: null, quotes }), /missing the latest data_value row/);
};

const testRouteNoLongerCallsLegacyIntraday = () => {
    const routeSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'marketData.js'), 'utf8');

    assert.strictEqual(routeSource.includes('returnIntraDayData'), false);
    assert.match(routeSource, /router\.get\('\/quote\/:symbol', auth, ensureVerified/);
    assert.match(routeSource, /quoteData = await getDamQuote\(\)/);
};

(async () => {
    await testRepository();
    testCalculation();
    await testServiceComposition();
    await testCashOnlyPortfolioSkipsMarketProvider();
    testMissingInputs();
    testRouteNoLongerCallsLegacyIntraday();

    console.log('DAM quote tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
