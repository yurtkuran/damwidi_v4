const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

class Transaction extends Sequelize.Model {}

Transaction.init(
    {
        id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
        },
        transaction_date: {
            type: Sequelize.DATEONLY,
            allowNull: false,
        },
        symbol: {
            type: Sequelize.STRING(5),
            allowNull: false,
        },
        type: {
            type: Sequelize.CHAR(1),
            allowNull: false,
        },
        amount: {
            type: Sequelize.DOUBLE(10, 2),
            allowNull: false,
        },
        shares: {
            type: Sequelize.DECIMAL(10, 5),
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(255),
            allowNull: false,
        },
        updated: {
            type: Sequelize.DATE,
            allowNull: false,
        },
    },
    {
        sequelize: db,
        tableName: 'data_transactions',
        timestamps: false,
    }
);

module.exports = Transaction;
