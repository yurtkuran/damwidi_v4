process.env.TZ = 'America/New_York';

const assert = require('assert');
const axios = require('axios');

const db = require('../../config/db').DB_MySQL;
const service = require('../../services/positionPerformance');

const legacyURL = 'https://www.damwidi.com/damwidiMain.php?mode=returnIntraDayData';
const symbols = ['AMZN', 'XLK'];

const selectLegacyFields = (performance) => ({
    symbol: performance.symbol,
    priceLast: Number(performance.priceLast),
    pricePreviousClose: Number(performance.pricePreviousClose),
    purchases: performance.purchases.map(({ dateBasis, priceBasis, priceGain, spyGain }) => ({
        dateBasis,
        priceBasis: Number(priceBasis),
        priceGain: Number(priceGain),
        spyGain: Number(spyGain),
    })),
});

(async () => {
    try {
        const legacyResponse = await axios.get(legacyURL, { timeout: 120000 });
        const legacyPerformance = legacyResponse.data.performanceData.data;
        const comparisons = {};

        for (const symbol of symbols) {
            const node = await service.getPositionPerformance(symbol);
            const legacy = selectLegacyFields(legacyPerformance[symbol]);

            assert.deepStrictEqual(node, legacy);
            comparisons[symbol] = {
                matches: true,
                purchaseCount: node.purchases.length,
            };
        }

        console.log(comparisons);
    } finally {
        await db.close();
    }
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
