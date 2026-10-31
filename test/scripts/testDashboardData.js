process.env.TZ = 'America/New_York';

const assert = require('assert');
const axios = require('axios');

const db = require('../../config/db').DB_MySQL;
const service = require('../../services/dashboardData');

const legacyURL = 'https://www.damwidi.com/damwidiMain.php?mode=returnIntraDayData';
const parseNumber = (value) => Number(String(value).replace(/[%,$]/g, ''));
const closeTo = (actual, expected, tolerance, label) => {
    assert.ok(Math.abs(actual - expected) < tolerance, `${label}: expected ${expected}, received ${actual}`);
};

(async () => {
    try {
        const [node, legacyResponse] = await Promise.all([
            service.getDashboardData(),
            axios.get(legacyURL, { timeout: 120000 }),
        ]);
        const legacy = legacyResponse.data;
        const legacyPositions = legacy.heatMapData.filter((position) => position.sector !== 'DAM');
        const legacyAllocationSummary = Object.values(legacy.allocationTable).filter((row) => ['C', 'I', 'Y'].includes(row.type));

        assert.deepStrictEqual(node.movers.map((mover) => mover.symbol), legacy.graphHeatMap.labels);
        assert.deepStrictEqual(node.movers.map((mover) => mover.gain), legacy.graphHeatMap.datasets[0].data);
        assert.deepStrictEqual(node.positions.map((position) => position.symbol), legacyPositions.map((position) => position.sector));
        assert.deepStrictEqual(node.allocationSummary.map((row) => row.symbol), legacyAllocationSummary.map((row) => row.symbol));

        for (const position of node.positions) {
            const expected = legacyPositions.find((row) => row.sector === position.symbol);
            assert.strictEqual(position.description, expected.description);
            closeTo(position.basis, Number(expected.basis), 0.0001, `${position.symbol} basis`);
            closeTo(position.shares, Number(expected.shares), 0.0001, `${position.symbol} shares`);
            closeTo(position.previousClose, Number(expected.prevClose), 0.0001, `${position.symbol} previousClose`);
            closeTo(position.last, Number(expected.last), 0.0001, `${position.symbol} last`);
            closeTo(position.gain, Number(expected.gain), 0.0001, `${position.symbol} gain`);
        }

        for (const row of node.allocationSummary) {
            const expected = legacy.allocationTable[row.symbol];
            assert.strictEqual(row.name, expected.name);
            assert.strictEqual(row.type, expected.type);
            closeTo(row.allocation, parseNumber(expected.allocation), 0.0501, `${row.symbol} allocation`);
            if (row.impliedPercent !== undefined) {
                closeTo(row.impliedPercent, parseNumber(expected.impliedPercent), 0.0501, `${row.symbol} impliedPercent`);
            }
        }

        const legacyDam = legacy.heatMapData.find((position) => position.sector === 'DAM');
        closeTo(node.fundQuote.latestPrice, Number(legacyDam.last), 0.0001, 'DAM latestPrice');
        closeTo(node.fundQuote.previousClose, Number(legacyDam.prevClose), 0.0001, 'DAM previousClose');
        closeTo(node.fundQuote.changePercent * 100, Number(legacyDam.gain), 0.0001, 'DAM gain');
        assert.strictEqual(node.dataQuality.complete, legacy.status.dataComplete);
        assert.deepStrictEqual(node.dataQuality.excludedSymbols, legacy.status.excludedSymbols);

        console.log({
            moverCount: node.movers.length,
            allocationSummaryCount: node.allocationSummary.length,
            positionCount: node.positions.length,
            moverOrderAndValuesMatch: true,
            allocationSummaryMatches: true,
            positionsMatch: true,
            fundQuoteMatches: true,
            dataQualityMatches: true,
        });
    } finally {
        await db.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
