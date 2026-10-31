const assert = require('assert');
const fs = require('fs');
const path = require('path');

const { buildAllocationData, calculateAllocation, createAllocationService } = require('../services/allocation');
const { getAllocationInputs } = require('../services/marketDataRepository');

const baseRows = [
    { symbol: 'CASH', weight: '0.00', shares: '1.00000', basis: '1000.000', name: 'Cash', description: 'Cash', type: 'C' },
    { symbol: 'SPY', weight: '0.00', shares: '2.00000', basis: '400.000', name: 'S&P 500', description: 'S&P 500', type: 'I' },
    { symbol: 'XLK', weight: '30.00', shares: '3.00000', basis: '100.000', name: 'Tech', description: 'Technology', type: 'S' },
    { symbol: 'XLV', weight: '20.00', shares: '0.00000', basis: '0.000', name: 'Health', description: 'Health Care', type: 'S' },
];

const stockRows = [
    { symbol: 'AAPL', weight: '0.00', shares: '4.00000', basis: '50.000', name: 'Apple', description: 'Apple', type: 'K' },
    { symbol: 'V', weight: '0.00', shares: '1.00000', basis: '200.000', name: 'Visa', description: 'Visa', type: 'K' },
];

const stockMappings = [
    { sector: 'XLK', symbol: 'AAPL' },
    { sector: null, symbol: null, description: 'Visa' },
];

const snapshot = {
    complete: true,
    excludedSymbols: [],
    fetchedAt: Date.parse('2026-10-31T16:00:00.000Z'),
    quotes: new Map([
        ['SPY', { latestPrice: 500 }],
        ['XLK', { latestPrice: 120 }],
        ['XLV', { latestPrice: 150 }],
        ['AAPL', { latestPrice: 60 }],
        ['V', { latestPrice: 250 }],
    ]),
};

const testRepository = async () => {
    const queries = [];
    const database = {
        async query(sql, options) {
            queries.push({ sql, options });

            if (sql.includes("type IN ('C', 'I', 'S')")) return baseRows;
            if (sql.includes("type = 'K'")) return stockRows;
            if (sql.includes('CALL stock_allocation()')) return stockMappings;
            throw new Error(`unexpected query: ${sql}`);
        },
    };

    const result = await getAllocationInputs(database);

    assert.strictEqual(queries.length, 3);
    assert.match(queries[0].sql, /ORDER BY FIELD\(type, 'C', 'I', 'S'\), weight DESC, sector/);
    assert.match(queries[1].sql, /ORDER BY sector/);
    assert.strictEqual(queries[2].sql, 'CALL stock_allocation()');
    assert.deepStrictEqual(result, { baseRows, stockMappings, stockRows });
};

const testCalculations = () => {
    assert.strictEqual(calculateAllocation(25, 100), 25);
    assert.strictEqual(calculateAllocation(25, 0), -1);

    const result = buildAllocationData({ baseRows, stockMappings, stockRows, snapshot });

    assert.strictEqual(result.asOf, '2026-10-31T16:00:00.000Z');
    assert.deepStrictEqual(result.rows.map((row) => row.symbol), [
        'CASH',
        'SPY',
        'XLK',
        'AAPL',
        'XLK_Total',
        'XLV',
    ]);
    assert.deepStrictEqual(result.fund, {
        symbol: 'DAM',
        description: 'Damwidi',
        currentValue: 2850,
        basis: 2300,
        change: 550,
    });
    assert.strictEqual(result.rows.some((row) => row.symbol === 'V'), false);

    const summary = result.rows.find((row) => row.symbol === 'XLK_Total');
    assert.deepStrictEqual(summary, {
        symbol: 'XLK_Total',
        sector: 'XLK',
        description: 'Tech',
        type: 'Y',
        shares: null,
        currentValue: 600,
        change: 100,
        allocation: (100 * 600) / 2850,
        weightPercent: 30,
        impliedPercent: (100 * 900) / 2850,
    });
    assert.strictEqual(result.rows.find((row) => row.symbol === 'XLV').type, 'Y');
    assert.deepStrictEqual(result.dataQuality, { complete: true, excludedSymbols: [] });
};

const testServiceComposition = async () => {
    let requestedSymbols;
    const service = createAllocationService({
        repository: {
            async getAllocationInputs() {
                return { baseRows, stockMappings, stockRows };
            },
        },
        snapshotService: {
            async getMarketSnapshot(options) {
                requestedSymbols = options.symbols;
                return snapshot;
            },
        },
    });

    const result = await service.getAllocationData();
    assert.deepStrictEqual(requestedSymbols, ['SPY', 'XLK', 'XLV', 'AAPL', 'V']);
    assert.strictEqual(result.rows.length, 6);
};

const testMissingInputs = () => {
    assert.throws(
        () => buildAllocationData({ baseRows, stockMappings, stockRows, snapshot: { ...snapshot, quotes: new Map() } }),
        /missing a quote for SPY/
    );
    assert.throws(
        () => buildAllocationData({ baseRows: baseRows.filter((row) => row.symbol !== 'SPY'), stockMappings, stockRows, snapshot }),
        /missing SPY/
    );
};

const testRouteAndClientContracts = () => {
    const routeSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'damwidi.js'), 'utf8');
    const actionSource = fs.readFileSync(path.join(__dirname, '..', 'client', 'src', 'actions', 'damwidiActions.js'), 'utf8');
    const allocationSource = fs.readFileSync(
        path.join(__dirname, '..', 'client', 'src', 'components', 'allocation', 'Allocation.js'),
        'utf8'
    );
    const purchaseSource = fs.readFileSync(
        path.join(__dirname, '..', 'client', 'src', 'components', 'allocation', 'PurchaseTable.js'),
        'utf8'
    );

    assert.match(routeSource, /router\.get\('\/allocationData', auth, ensureMember/);
    assert.match(routeSource, /const allocationData = await getAllocationData\(\)/);
    assert.match(actionSource, /axios\.get\(`\/api\/damwidi\/allocationData`\)/);
    assert.match(actionSource, /if \(positionPerformance\[symbol\] \|\| positionPerformanceLoading\[symbol\]\) return/);
    assert.strictEqual(allocationSource.includes('getIntraDayData'), false);
    assert.match(purchaseSource, /getPositionPerformance\(symbol\)/);
};

(async () => {
    await testRepository();
    testCalculations();
    await testServiceComposition();
    testMissingInputs();
    testRouteAndClientContracts();

    console.log('allocation data tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
