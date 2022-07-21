// 'use strict';
const { Sequelize, DataTypes, Op } = require('sequelize');

// bring in local dependencies
const { logTime } = require('../services/knowMoment');

const sequelize = new Sequelize(process.env.DB_MYSQL_DATABASE, process.env.DB_MYSQL_USER, process.env.DB_MYSQL_PASS, {
    host: process.env.DB_MYSQL_HOST,
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    logging: false,
    timezone: '-05:00',
});

// connect all the models/tables in the database to a db object, so everything is accessible via one object
const db = {
    Sequelize,
    sequelize,
    Op,
    History: require('../models/History.model')(sequelize, Sequelize, DataTypes),
    Sector: require('../models/Sector.model')(sequelize, Sequelize, DataTypes),
    Stock: require('../models/Stock.model')(sequelize, Sequelize, DataTypes),
    Transaction: require('../models/Transaction.model')(sequelize, Sequelize, DataTypes),
    Value: require('../models/Value.model')(sequelize, Sequelize, DataTypes),
};

//Relations
db.Sector.hasOne(db.Stock, { foreignKey: 'symbol', sourceKey: 'symbol' });

const connectMySQL = async () => {
    try {
        const conn = await sequelize.authenticate();
        console.log(`${logTime()}: MySQL connected:   ${sequelize.config.database} on ${sequelize.config.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

module.exports = {
    db,
    connectMySQL,
};
