const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

const getDamValuationInputs = async (database = db) => {
    const [performanceRows, valueRows] = await Promise.all([
        database.query(
            `
                SELECT
                    sector AS symbol,
                    type,
                    shares,
                    basis
                FROM data_performance
                WHERE (type = 'C' AND sector = 'CASH')
                   OR (type IN ('S', 'I', 'K') AND shares <> 0)
                ORDER BY sector
            `,
            { type: Sequelize.QueryTypes.SELECT }
        ),
        database.query(
            `
                SELECT
                    date,
                    total_shares,
                    share_value,
                    bivio_value
                FROM data_value
                ORDER BY date DESC
                LIMIT 1
            `,
            { type: Sequelize.QueryTypes.SELECT }
        ),
    ]);

    return {
        cash: performanceRows.find((row) => row.type === 'C' && row.symbol === 'CASH') || null,
        holdings: performanceRows.filter((row) => row.type !== 'C'),
        latestValue: valueRows[0] || null,
    };
};

module.exports = {
    getDamValuationInputs,
};
