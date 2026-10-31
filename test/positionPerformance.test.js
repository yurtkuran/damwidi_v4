const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
    applySplits,
    buildPositionPerformance,
    calculateGain,
    createPositionPerformanceService,
    getNewYorkDate,
    replayPosition,
} = require('../services/positionPerformance');
const {
    getHistoricalCloses,
    getPositionPreviousClose,
    getPositionSplits,
    getPositionTransactions,
} = require('../services/portfolioRepository');

const testRepository = async () => {
    const queries = [];
    const database = {
        async query(sql, options) {
            queries.push({ sql, options });
            return [];
        },
    };

    assert.deepStrictEqual(await getHistoricalCloses('SPY', [], database), []);
    assert.strictEqual(queries.length, 0);

    await getHistoricalCloses('SPY', ['2026-01-02'], database);
    await getPositionPreviousClose('AAPL', database);
    await getPositionSplits('AAPL', database);
    await getPositionTransactions('AAPL', '2026-10-31', database);

    assert.strictEqual(queries.length, 4);
    assert.match(queries[0].sql, /FROM data_history/);
    assert.deepStrictEqual(queries[0].options.replacements, { dates: ['2026-01-02'], symbol: 'SPY' });
    assert.match(queries[1].sql, /FROM data_performance/);
    assert.match(queries[1].sql, /previous, `2day`/);
    assert.match(queries[1].sql, /WHERE sector = :symbol/);
    assert.match(queries[2].sql, /FROM data_splits/);
    assert.match(queries[2].sql, /ORDER BY date DESC/);
    assert.match(queries[3].sql, /FROM data_transactions/);
    assert.match(queries[3].sql, /type IN \('B', 'S', 'D'\)/);
    assert.match(queries[3].sql, /ORDER BY transaction_date ASC, id ASC/);
    assert.deepStrictEqual(queries[3].options.replacements, { symbol: 'AAPL', throughDate: '2026-10-31' });
};

const testTransactionReplay = () => {
    const position = replayPosition([
        { transaction_date: '2024-01-02', type: 'B', shares: '10.00000', price: '100' },
        { transaction_date: '2024-02-02', type: 'D', shares: '0.00000', price: null },
        { transaction_date: '2024-03-02', type: 'S', shares: '-10.00000', price: null },
        { transaction_date: '2025-01-02', type: 'B', shares: '2.00000', price: '200' },
        { transaction_date: '2025-01-02', type: 'B', shares: '3.00000', price: '210' },
    ]);

    assert.deepStrictEqual(position.purchases, ['2025-01-02', '2025-01-02']);
    assert.strictEqual(position.basisByDate.get('2025-01-02'), 200);
    assert.strictEqual(
        replayPosition([
            { transaction_date: '2024-01-02', type: 'B', shares: '0.000004', price: '100' },
        ]),
        null
    );
};

const testCalculations = () => {
    const splits = [
        { date: '2025-06-01', split_from: 1, split_to: 2 },
        { date: '2024-06-01', split_from: 1, split_to: 10 },
    ];

    assert.strictEqual(applySplits(200, '2025-01-02', splits, '2026-10-31'), 100);
    assert.strictEqual(applySplits(200, '2025-06-01', splits, '2026-10-31'), 100);
    assert.strictEqual(applySplits(200, '2025-06-02', splits, '2026-10-31'), 200);
    assert.strictEqual(calculateGain(120, 100), 20);
    assert.strictEqual(calculateGain(120, 0), 0);
    assert.throws(
        () => applySplits(200, '2025-01-02', [{ date: '2025-06-01', split_from: 0, split_to: 2 }], '2026-10-31'),
        /invalid split ratio/
    );
};

const testResponseBuilder = () => {
    const result = buildPositionPerformance({
        symbol: 'AAPL',
        position: {
            basisByDate: new Map([['2025-01-02', 200]]),
            purchases: ['2025-01-02', '2025-01-02'],
        },
        splits: [{ date: '2025-06-01', split_from: 1, split_to: 2 }],
        spyHistory: [{ date: '2025-01-02', close: '500.000' }],
        symbolQuote: { latestPrice: 126, previousClose: '125.500' },
        spyQuote: { latestPrice: 600 },
        previousClose: '124.500',
        throughDate: '2026-10-31',
    });

    assert.deepStrictEqual(result, {
        symbol: 'AAPL',
        priceLast: 126,
        pricePreviousClose: 124.5,
        purchases: [
            { dateBasis: '2025-01-02', priceBasis: 100, priceGain: 26, spyGain: 20 },
            { dateBasis: '2025-01-02', priceBasis: 100, priceGain: 26, spyGain: 20 },
        ],
    });
};

const testServiceComposition = async () => {
    const calls = { dates: null, snapshotSymbols: null, symbol: null, throughDate: null };
    const service = createPositionPerformanceService({
        now: () => new Date('2026-11-01T03:30:00.000Z'),
        repository: {
            async getPositionTransactions(symbol, throughDate) {
                calls.symbol = symbol;
                calls.throughDate = throughDate;
                return [
                    { transaction_date: '2025-01-02', type: 'B', shares: '2', price: '100' },
                    { transaction_date: '2025-01-02', type: 'B', shares: '1', price: '100' },
                ];
            },
            async getPositionSplits() {
                return [];
            },
            async getPositionPreviousClose() {
                return { previous: '109.000', '2day': '108.000' };
            },
            async getHistoricalCloses(symbol, dates) {
                assert.strictEqual(symbol, 'SPY');
                calls.dates = dates;
                return [{ date: '2025-01-02', close: '500' }];
            },
        },
        snapshotService: {
            async getMarketSnapshot(options) {
                calls.snapshotSymbols = options.symbols;
                return {
                    session: 'premarket',
                    quotes: new Map([
                        ['AAPL', { latestPrice: 110, previousClose: 109 }],
                        ['SPY', { latestPrice: 550, previousClose: 549 }],
                    ]),
                };
            },
        },
    });

    const result = await service.getPositionPerformance(' aapl ');

    assert.strictEqual(calls.symbol, 'AAPL');
    assert.strictEqual(calls.throughDate, '2026-10-31');
    assert.deepStrictEqual(calls.dates, ['2025-01-02']);
    assert.deepStrictEqual(calls.snapshotSymbols, ['AAPL', 'SPY']);
    assert.strictEqual(result.pricePreviousClose, 108);
    assert.strictEqual(result.purchases.length, 2);
};

const testClosedPositionSkipsDependencies = async () => {
    const service = createPositionPerformanceService({
        repository: {
            async getPositionTransactions() {
                return [
                    { transaction_date: '2025-01-02', type: 'B', shares: '2', price: '100' },
                    { transaction_date: '2025-02-02', type: 'S', shares: '-2', price: null },
                ];
            },
            async getPositionSplits() {
                throw new Error('splits should not be requested');
            },
            async getPositionPreviousClose() {
                throw new Error('previous close should not be requested');
            },
            async getHistoricalCloses() {
                throw new Error('history should not be requested');
            },
        },
        snapshotService: {
            async getMarketSnapshot() {
                throw new Error('market snapshot should not be requested');
            },
        },
    });

    assert.strictEqual(await service.getPositionPerformance('AAPL'), null);
};

const testMissingInputs = async () => {
    assert.throws(
        () =>
            buildPositionPerformance({
                symbol: 'AAPL',
                position: { basisByDate: new Map([['2025-01-02', 100]]), purchases: ['2025-01-02'] },
                splits: [],
                spyHistory: [],
                symbolQuote: { latestPrice: 110, previousClose: 109 },
                spyQuote: { latestPrice: 550 },
                previousClose: 109,
                throughDate: '2026-10-31',
            }),
        /missing SPY history/
    );

    const service = createPositionPerformanceService({
        repository: {
            async getPositionTransactions() {
                return [{ transaction_date: '2025-01-02', type: 'B', shares: '2', price: '100' }];
            },
            async getPositionSplits() {
                return [];
            },
            async getPositionPreviousClose() {
                return { previous: '99.000' };
            },
            async getHistoricalCloses() {
                return [{ date: '2025-01-02', close: '500' }];
            },
        },
        snapshotService: {
            async getMarketSnapshot() {
                return { quotes: new Map([['SPY', { latestPrice: 550 }]]) };
            },
        },
    });

    await assert.rejects(service.getPositionPerformance('AAPL'), /missing a current quote for AAPL/);
};

const testRouteContract = () => {
    const routeSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'damwidi.js'), 'utf8');

    assert.match(routeSource, /'\/positionPerformance\/:symbol',\s*auth,\s*ensureMember/);
    assert.match(routeSource, /check\('symbol', 'invalid symbol'\)/);
    assert.match(routeSource, /res\.status\(404\)\.json\(\{ msg: 'position not found' \}\)/);
    assert.match(routeSource, /const performance = await getPositionPerformance\(req\.params\.symbol\)/);
};

(async () => {
    await testRepository();
    testTransactionReplay();
    testCalculations();
    testResponseBuilder();
    await testServiceComposition();
    await testClosedPositionSkipsDependencies();
    await testMissingInputs();
    testRouteContract();
    assert.strictEqual(getNewYorkDate(new Date('2026-11-01T03:30:00.000Z')), '2026-10-31');

    console.log('position performance tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
