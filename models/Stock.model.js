const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

class Stock extends Sequelize.Model {}

Stock.init(
    {
        sector: {
            type: Sequelize.CHAR(5),
            allowNull: false,
            trim: true,
        },
        symbol: {
            type: Sequelize.CHAR(5),
            allowNull: false,
            trim: true,
        },
        companyName: {
            type: Sequelize.CHAR(5),
            allowNull: false,
            trim: true,
        },
    },
    {
        sequelize: db,
        tableName: 'data_stocks',
        timestamps: true,
        paranoid: true,
    }
);

module.exports = Stock;
