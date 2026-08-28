const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

const sectorTimeframePerformanceQuery = `
    SELECT
        id,
        sector,
        weight,
        shares,
        basis,
        previous,
        previousDate,
        \`1day\`,
        \`2day\`,
        \`3day\`,
        \`4day\`,
        \`1wk\`,
        \`2wk\`,
        \`4wk\`,
        \`8wk\`,
        \`1qtr\`,
        \`1yr\`,
        ytd,
        \`as-of\`,
        name,
        description,
        sectorDescription,
        effectiveDate,
        fetchedDate,
        type,
        DATE_FORMAT(updated, '%Y-%m-%d %H:%i:%s') AS updated,
        DATE_FORMAT(createdAt, '%Y-%m-%d %H:%i:%s') AS createdAt,
        DATE_FORMAT(updatedAt, '%Y-%m-%d %H:%i:%s') AS updatedAt,
        DATE_FORMAT(deletedAt, '%Y-%m-%d %H:%i:%s') AS deletedAt
    FROM data_performance
    WHERE INSTR('SIFK', type)
    ORDER BY FIELD(type, 'F', 'I', 'S', 'K'), sector
`;

const formatSectorTimeframePerformanceData = (rows) => {
    if (rows.length === 0) {
        return [];
    }

    return rows.reduce((data, row) => {
        data[row.sector] = row;
        return data;
    }, {});
};

const getSectorTimeframePerformanceData = async (database = db) => {
    const rows = await database.query(sectorTimeframePerformanceQuery, {
        type: Sequelize.QueryTypes.SELECT,
    });

    return formatSectorTimeframePerformanceData(rows);
};

module.exports = {
    formatSectorTimeframePerformanceData,
    getSectorTimeframePerformanceData,
};
