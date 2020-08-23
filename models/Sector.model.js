const Sequelize = require('sequelize');
const db = require('../config/db').DB_MySQL;

class Sector extends Sequelize.Model {}

Sector.init(
    {
        symbol: {
            field: 'sector',
            type: Sequelize.CHAR(5),
            allowNull: false,
            trim: true,
            // primaryKey:   true
        },
        weight: {
            type: Sequelize.DECIMAL(4, 2),
            allowNull: false,
            defaultValue: 0.0,
        },
        shares: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
        },
        basis: {
            type: Sequelize.DECIMAL(8, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        previous: {
            type: Sequelize.DECIMAL(8, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        '1wk': {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        '2wk': {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        '4wk': {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        '8wk': {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        '1qtr': {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        '1yr': {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        ytd: {
            type: Sequelize.DECIMAL(6, 3),
            allowNull: false,
            defaultValue: 0.0,
        },
        'as-of': {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            trim: true,
        },
        description: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            trim: true,
        },
        sectorDescription: {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: '',
            trim: true,
        },
        effectiveDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        fetchedDate: {
            type: Sequelize.DATEONLY,
            allowNull: true,
        },
        type: {
            type: Sequelize.CHAR(1),
            defaultValue: '',
            allowNull: false,
        },
    },
    {
        sequelize: db,
        tableName: 'data_performance',
        timestamps: true,
        // paranoid:   true
    }
);

module.exports = Sector;
