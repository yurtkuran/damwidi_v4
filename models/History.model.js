const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

class History extends Sequelize.Model {}

History.init(
    {
        symbol: {
            type: Sequelize.CHAR(5),
            allowNull: false,
            trim: true,
        },
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        open: {
            type: Sequelize.CHAR(5),
            type: Sequelize.DECIMAL(8, 4),
            allowNull: false,
            defaultValue: 0.0,
        },
        high: {
            type: Sequelize.CHAR(5),
            type: Sequelize.DECIMAL(8, 4),
            allowNull: false,
            defaultValue: 0.0,
        },
        low: {
            type: Sequelize.CHAR(5),
            type: Sequelize.DECIMAL(8, 4),
            allowNull: false,
            defaultValue: 0.0,
        },
        close: {
            type: Sequelize.CHAR(5),
            type: Sequelize.DECIMAL(8, 4),
            allowNull: false,
            defaultValue: 0.0,
        },
    },
    {
        sequelize: db,
        tableName: 'data_history',
        timestamps: false,
        paranoid: true,
    }
);

module.exports = History;
