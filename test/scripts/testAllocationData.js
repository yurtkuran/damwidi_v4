process.env.TZ = 'America/New_York';

const assert = require('assert');
const axios = require('axios');

const db = require('../../config/db').DB_MySQL;
const service = require('../../services/allocation');

const legacyURL = 'https://www.damwidi.com/damwidiMain.php?mode=returnIntraDayData';
const parseNumber = (value) => Number(String(value).replace(/[%,$]/g, ''));
const closeTo = (actual, expected, tolerance, label) => {
    assert.ok(Math.abs(actual - expected) < tolerance, `${label}: expected ${expected}, received ${actual}`);
};

(async () => {
    try {
        const [node, legacyResponse] = await Promise.all([
            service.getAllocationData(),
            axios.get(legacyURL, { timeout: 120000 }),
        ]);
        const legacy = legacyResponse.data.allocationTable;
        const legacyRows = Object.values(legacy).filter((row) => row.symbol !== 'DAM');

        assert.deepStrictEqual(node.rows.map((row) => row.symbol), legacyRows.map((row) => row.symbol));

        for (const row of node.rows) {
            const expected = legacy[row.symbol];
            assert.strictEqual(row.sector, expected.sector);
            assert.strictEqual(row.description, expected.description);
            assert.strictEqual(row.type, expected.type);
            assert.strictEqual(row.shares, expected.shares);
            closeTo(row.currentValue, parseNumber(expected.currentValue), 0.0051, `${row.symbol} currentValue`);
            closeTo(row.change, parseNumber(expected.change), 0.0051, `${row.symbol} change`);
            closeTo(row.allocation, parseNumber(expected.allocation), 0.0501, `${row.symbol} allocation`);

            if (Object.prototype.hasOwnProperty.call(expected, 'weightPercent')) {
                closeTo(row.weightPercent, parseNumber(expected.weightPercent), 0.0001, `${row.symbol} weightPercent`);
                closeTo(row.impliedPercent, parseNumber(expected.impliedPercent), 0.0501, `${row.symbol} impliedPercent`);
            }
        }

        const legacyFund = legacy.DAM;
        closeTo(node.fund.currentValue, parseNumber(legacyFund.currentValue), 0.0051, 'DAM currentValue');
        closeTo(node.fund.basis, Number(legacyFund.basis), 0.0001, 'DAM basis');
        closeTo(node.fund.change, parseNumber(legacyFund.change), 0.0051, 'DAM change');
        assert.strictEqual(node.dataQuality.complete, legacyResponse.data.status.dataComplete);
        assert.deepStrictEqual(node.dataQuality.excludedSymbols, legacyResponse.data.status.excludedSymbols);

        console.log({
            rowCount: node.rows.length,
            rowOrderMatches: true,
            visibleValuesMatch: true,
            fundMatches: true,
            dataQualityMatches: true,
        });
    } finally {
        await db.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
