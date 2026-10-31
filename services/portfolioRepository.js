const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

const getHistoricalCloses = async (symbol, dates, database = db) => {
    if (dates.length === 0) {
        return [];
    }

    return database.query(
        `
            SELECT date, close
            FROM data_history
            WHERE symbol = :symbol
              AND date IN (:dates)
            ORDER BY date
        `,
        {
            replacements: { dates, symbol },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
};

const getPositionSplits = async (symbol, database = db) => {
    return database.query(
        `
            SELECT date, split_from, split_to
            FROM data_splits
            WHERE symbol = :symbol
            ORDER BY date DESC
        `,
        {
            replacements: { symbol },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
};

const getPositionPreviousClose = async (symbol, database = db) => {
    const rows = await database.query(
        `
            SELECT previous, \`2day\`
            FROM data_performance
            WHERE sector = :symbol
            LIMIT 1
        `,
        {
            replacements: { symbol },
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    return rows[0] || null;
};

const getPositionTransactions = async (symbol, throughDate, database = db) => {
    return database.query(
        `
            SELECT
                id,
                transaction_date,
                type,
                amount,
                shares,
                CASE
                    WHEN type = 'B' AND shares <> 0 THEN ABS(amount / shares)
                    ELSE NULL
                END AS price
            FROM data_transactions
            WHERE symbol = :symbol
              AND transaction_date <= :throughDate
              AND type IN ('B', 'S', 'D')
            ORDER BY transaction_date ASC, id ASC
        `,
        {
            replacements: { symbol, throughDate },
            type: Sequelize.QueryTypes.SELECT,
        }
    );
};

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
    getHistoricalCloses,
    getPositionPreviousClose,
    getPositionSplits,
    getPositionTransactions,
};
