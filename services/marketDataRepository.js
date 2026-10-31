const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

const getAboveBelowSectors = async (database = db) => {
    return database.query(
        `
            SELECT sector, name, type
            FROM data_performance
            WHERE INSTR('SI', type)
            ORDER BY sector
        `,
        { type: Sequelize.QueryTypes.SELECT }
    );
};

const getRecentHistory = async (symbol, length, database = db) => {
    const rows = await database.query(
        `
            SELECT date, close
            FROM data_history
            WHERE symbol = :symbol
            ORDER BY date DESC
            LIMIT ${Number(length)}
        `,
        {
            replacements: { symbol },
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    return rows.reverse();
};

const getYTDHistoryLength = async (year, database = db) => {
    const rows = await database.query(
        `
            SELECT COUNT(*) AS count
            FROM data_history
            WHERE symbol = 'SPY'
              AND date >= :startDate
        `,
        {
            replacements: { startDate: `${year}-01-01` },
            type: Sequelize.QueryTypes.SELECT,
        }
    );

    return Number(rows[0].count) + 1;
};

const getMarketSnapshotRows = async (database = db) => {
    return database.query(
        `
            SELECT
                sector AS symbol,
                type,
                shares,
                previous,
                previousDate,
                \`1day\`,
                \`2day\`
            FROM data_performance
            WHERE type IN ('S', 'I', 'K')
            ORDER BY sector
        `,
        { type: Sequelize.QueryTypes.SELECT }
    );
};

const getAllocationInputs = async (database = db) => {
    const [baseRows, stockRows, stockMappings] = await Promise.all([
        database.query(
            `
                SELECT
                    sector AS symbol,
                    weight,
                    shares,
                    basis,
                    previous,
                    \`2day\`,
                    name,
                    description,
                    type
                FROM data_performance
                WHERE type IN ('C', 'I', 'S')
                ORDER BY FIELD(type, 'C', 'I', 'S'), weight DESC, sector
            `,
            { type: Sequelize.QueryTypes.SELECT }
        ),
        database.query(
            `
                SELECT
                    sector AS symbol,
                    weight,
                    shares,
                    basis,
                    previous,
                    \`2day\`,
                    name,
                    description,
                    type
                FROM data_performance
                WHERE type = 'K'
                ORDER BY sector
            `,
            { type: Sequelize.QueryTypes.SELECT }
        ),
        database.query('CALL stock_allocation()'),
    ]);

    return { baseRows, stockMappings, stockRows };
};

module.exports = {
    getAllocationInputs,
    getAboveBelowSectors,
    getMarketSnapshotRows,
    getRecentHistory,
    getYTDHistoryLength,
};
