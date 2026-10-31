process.env.TZ = 'America/New_York';

const assert = require('assert');
const service = require('../../services/marketSnapshot');
const db = require('../../config/db').DB_MySQL;

(async () => {
    try {
        const first = await service.getMarketSnapshot();

        const second = await service.getMarketSnapshot({
            symbols: ['SPY', 'QQQ', 'DIA'],
        });

        assert.strictEqual(first.complete, true, `snapshot excluded symbols: ${first.excludedSymbols.join(', ')}`);
        assert.strictEqual(first.quotes.size, first.symbols.length);
        assert.deepStrictEqual(second.symbols, ['DIA', 'QQQ', 'SPY']);
        assert.strictEqual(second.complete, true);
        assert.strictEqual(first.fetchedAt, second.fetchedAt);

        console.log({
            session: first.session,
            symbolCount: first.symbols.length,
            quoteCount: first.quotes.size,
            complete: first.complete,
            excludedSymbols: first.excludedSymbols,
            sameSnapshot: first.fetchedAt === second.fetchedAt,
        });
    } finally {
        await db.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
