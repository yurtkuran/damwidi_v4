const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {
    buildDashboardData,
    createDashboardDataService,
    projectDashboardData,
} = require('../services/dashboardData');
const { getLatestDamValue } = require('../services/portfolioRepository');

const baseRows = [
    { symbol: 'CASH', weight: '0', shares: '1', basis: '100', previous: '100', '2day': '100', name: 'Cash', description: 'Cash', type: 'C' },
    { symbol: 'SPY', weight: '0', shares: '1', basis: '450', previous: '495', '2day': '490', name: 'S&P 500', description: 'S&P 500', type: 'I' },
    { symbol: 'QQQ', weight: '0', shares: '1', basis: '350', previous: '398', '2day': '390', name: 'Nasdaq', description: 'Nasdaq', type: 'I' },
    { symbol: 'DIA', weight: '0', shares: '1', basis: '440', previous: '449', '2day': '455', name: 'Dow', description: 'Dow', type: 'I' },
    { symbol: 'XLK', weight: '30', shares: '2', basis: '150', previous: '198', '2day': '190', name: 'Tech', description: 'Technology', type: 'S' },
];
const stockRows = [
    { symbol: 'AAPL', weight: '0', shares: '3', basis: '80', previous: '99', '2day': '95', name: 'Apple', description: 'Apple Inc.', type: 'K' },
];
const stockMappings = [{ symbol: 'AAPL', sector: 'XLK' }];
const latestValue = { date: '2026-10-30', total_shares: '20', share_value: '100', bivio_value: '100' };
const quote = (symbol, latestPrice, previousClose) => ({
    symbol,
    latestPrice,
    previousClose,
    change: latestPrice - previousClose,
    changePercent: (latestPrice - previousClose) / previousClose,
});
const snapshot = {
    session: 'closed',
    fetchedAt: Date.parse('2026-10-31T16:00:00.000Z'),
    complete: true,
    excludedSymbols: [],
    quotes: new Map([
        ['SPY', quote('SPY', 500, 490)],
        ['QQQ', quote('QQQ', 400, 390)],
        ['DIA', quote('DIA', 450, 455)],
        ['XLK', quote('XLK', 200, 190)],
        ['AAPL', quote('AAPL', 100, 95)],
    ]),
};

const testRepository = async () => {
    const queries = [];
    const database = {
        async query(sql, options) {
            queries.push({ sql, options });
            return [latestValue];
        },
    };

    assert.deepStrictEqual(await getLatestDamValue(database), latestValue);
    assert.strictEqual(queries.length, 1);
    assert.match(queries[0].sql, /FROM data_value/);
    assert.match(queries[0].sql, /ORDER BY date DESC/);
};

const testResponseBuilder = () => {
    const result = buildDashboardData({ baseRows, latestValue, snapshot, stockMappings, stockRows });

    assert.deepStrictEqual(Object.keys(result), [
        'asOf',
        'fundQuote',
        'indexQuotes',
        'movers',
        'allocationSummary',
        'positions',
        'dataQuality',
    ]);
    assert.strictEqual(result.asOf, '2026-10-31T16:00:00.000Z');
    assert.deepStrictEqual(result.fundQuote, {
        symbol: 'DAM',
        latestPrice: 2150,
        change: 150,
        changePercent: 0.075,
        previousClose: 2000,
    });
    assert.deepStrictEqual(Object.keys(result.indexQuotes), ['DAM', 'SPY', 'QQQ', 'DIA']);
    assert.deepStrictEqual(result.indexQuotes.SPY, {
        symbol: 'SPY',
        latestPrice: 500,
        change: 10,
        changePercent: 10 / 490,
        previousClose: 490,
    });
    assert.deepStrictEqual(result.movers.map((mover) => mover.symbol), ['DAM', 'XLK', 'AAPL', 'QQQ', 'SPY', 'DIA']);
    assert.strictEqual(result.movers.find((mover) => mover.symbol === 'XLK').gain, 5.26);
    assert.strictEqual(result.positions.length, 5);
    assert.strictEqual(result.positions.find((position) => position.symbol === 'SPY').previousClose, 495);
    assert.strictEqual(result.positions.find((position) => position.symbol === 'AAPL').description, 'Apple Inc.');
    assert.deepStrictEqual(result.allocationSummary.map((row) => row.symbol), ['CASH', 'SPY', 'QQQ', 'DIA', 'XLK_Total']);
    assert.strictEqual(result.allocationSummary.find((row) => row.symbol === 'XLK_Total').name, 'Tech');
    assert.deepStrictEqual(result.dataQuality, { complete: true, excludedSymbols: [] });

    const member = projectDashboardData(result, true);
    const nonMember = projectDashboardData(result, false);
    assert.strictEqual(member.positions.length, 5);
    assert.deepStrictEqual(nonMember.positions, []);
    assert.deepStrictEqual(nonMember.fundQuote, member.fundQuote);
    assert.deepStrictEqual(nonMember.movers, member.movers);
};

const testPremarketPreviousClose = () => {
    const result = buildDashboardData({
        baseRows,
        latestValue,
        snapshot: { ...snapshot, session: 'premarket' },
        stockMappings,
        stockRows,
    });

    assert.strictEqual(result.positions.find((position) => position.symbol === 'SPY').previousClose, 490);
    assert.strictEqual(result.positions.find((position) => position.symbol === 'AAPL').previousClose, 95);
};

const testServiceComposition = async () => {
    let snapshotOptions;
    const service = createDashboardDataService({
        repository: {
            async getAllocationInputs() {
                return { baseRows, stockMappings, stockRows };
            },
        },
        valuationRepository: {
            async getLatestDamValue() {
                return latestValue;
            },
        },
        snapshotService: {
            async getMarketSnapshot(options) {
                snapshotOptions = options;
                return snapshot;
            },
        },
    });

    const result = await service.getDashboardData();
    assert.strictEqual(snapshotOptions, undefined);
    assert.strictEqual(result.positions.length, 5);
};

const testMissingInputs = () => {
    assert.throws(
        () => buildDashboardData({ baseRows, latestValue, snapshot: { ...snapshot, quotes: new Map() }, stockMappings, stockRows }),
        /missing a quote/
    );
    assert.throws(
        () => buildDashboardData({ baseRows, latestValue: null, snapshot, stockMappings, stockRows }),
        /latest data_value row/
    );
};

const testRouteAndClientContracts = () => {
    const routeSource = fs.readFileSync(path.join(__dirname, '..', 'routes', 'damwidi.js'), 'utf8');
    const actionSource = fs.readFileSync(path.join(__dirname, '..', 'client', 'src', 'actions', 'damwidiActions.js'), 'utf8');
    const dashboardSource = fs.readFileSync(path.join(__dirname, '..', 'client', 'src', 'components', 'dashboard', 'Dashboard.js'), 'utf8');
    const indexCardSource = fs.readFileSync(path.join(__dirname, '..', 'client', 'src', 'components', 'dashboard', 'IndexCard.js'), 'utf8');
    const positionDetailSource = fs.readFileSync(path.join(__dirname, '..', 'client', 'src', 'components', 'dashboard', 'PositionDetail.js'), 'utf8');

    assert.match(routeSource, /router\.get\('\/dashboardData', auth/);
    assert.match(routeSource, /projectDashboardData\(dashboardData, req\.user\.isMember\)/);
    assert.match(actionSource, /axios\.get\(`\/api\/damwidi\/dashboardData`\)/);
    assert.strictEqual(actionSource.includes('/api/damwidi/intraDayData'), false);
    assert.strictEqual(dashboardSource.includes('getIntraDayData'), false);
    assert.match(dashboardSource, /initialQuote=\{dashboardData\.indexQuotes\.DAM\}/);
    assert.strictEqual(indexCardSource.includes('axios'), false);
    assert.match(positionDetailSource, /getPositionPerformance\(symbol\)/);
};

(async () => {
    await testRepository();
    testResponseBuilder();
    testPremarketPreviousClose();
    await testServiceComposition();
    testMissingInputs();
    testRouteAndClientContracts();

    console.log('dashboard data tests passed');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
