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

module.exports = {
    getAboveBelowSectors,
    getRecentHistory,
    getYTDHistoryLength,
};
