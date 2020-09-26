const mongoose = require('mongoose');
const Sequelize = require('sequelize');

DB_MySQL = new Sequelize(process.env.DB_MYSQL_DATABASE, process.env.DB_MYSQL_USER, process.env.DB_MYSQL_PASS, {
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

const connectMySQL = async () => {
    try {
        const conn = await DB_MySQL.authenticate();
        console.log(`MySQL connected:   ${DB_MySQL.config.database} on ${DB_MySQL.config.host}`);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

const connectMongoDB = async () => {
    const db = `mongodb+srv://${process.env.DB_MONGO_USER}:${process.env.DB_MONGO_PASS}@cluster0-j2v6w.mongodb.net/damwidi?retryWrites=true&w=majority`;

    try {
        const conn = await mongoose.connect(db, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
            useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected: ${conn.connection.name} on ${conn.connection.host}`);
    } catch (err) {
        console.error(err.message);

        // exit process with error
        process.exit(1);
    }
};

module.exports = {
    DB_MySQL,
    connectMySQL,
    connectMongoDB,
};
