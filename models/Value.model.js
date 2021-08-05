const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

class Value extends Sequelize.Model {}

Value.init(
    {
        date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
            primaryKey: true,
        },
        SPY: {
            type: Sequelize.DECIMAL(8, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        cash: {
            type: Sequelize.DECIMAL(8, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        market_value: {
            type: Sequelize.DECIMAL(10, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        account_value: {
            type: Sequelize.DECIMAL(10, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        payments: {
            type: Sequelize.DECIMAL(8, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        total_shares: {
            type: Sequelize.DECIMAL(12, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        share_value: {
            type: Sequelize.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        bivio_value: {
            type: Sequelize.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        open: {
            type: Sequelize.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        high: {
            type: Sequelize.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        low: {
            type: Sequelize.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        close: {
            type: Sequelize.DECIMAL(8, 6),
            allowNull: false,
            defaultValue: 0.0,
        },
        source: {
            type: Sequelize.STRING,
            allowNull: false,
            trim: true,
        },
        updated: {
            type: Sequelize.DATE,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        tableName: 'data_value',
        timestamps: false,
        paranoid: true,
    }
);

module.exports = Value;
