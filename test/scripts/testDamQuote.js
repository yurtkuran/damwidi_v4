process.env.TZ = 'America/New_York';

const assert = require('assert');
const service = require('../../services/portfolioValuation');
const db = require('../../config/db').DB_MySQL;

(async () => {
    try {
        const first = await service.getDamQuote();
        const second = await service.getDamQuote();

        assert.deepStrictEqual(Object.keys(first), [
            'symbol',
            'latestPrice',
            'change',
            'changePercent',
            'previousClose',
        ]);
        assert.strictEqual(first.symbol, 'DAM');

        for (const field of ['latestPrice', 'change', 'changePercent', 'previousClose']) {
            assert.strictEqual(Number.isFinite(first[field]), true, `${field} must be a finite number`);
        }

        assert.deepStrictEqual(second, first);

        console.log({
            quote: first,
            cacheReused: true,
        });
    } finally {
        await db.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
