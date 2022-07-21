// insert JSON from command line:
// mongoimport --uri="mongodb+srv://developmentUser@cluster0.j2v6w.mongodb.net/damwidi" --collection=chartConfig --file=chartConfig.json --jsonArray --drop
// https://www.mongodb.com/docs/database-tools/mongoimport/
// https://www.mongodb.com/docs/database-tools/mongoimport/#examples
//
// connect using mongosh
// mongosh "mongodb+srv://cluster0.j2v6w.mongodb.net/damwidi" --apiVersion 1 --username=developmentUser

const mongoose = require('mongoose');

// bring in local dependencies
const { logTime } = require('../services/knowMoment');

const connectMongoDB = async () => {
    const db = `mongodb+srv://${process.env.DB_MONGO_USER}:${process.env.DB_MONGO_PASS}@cluster0.j2v6w.mongodb.net/damwidi?retryWrites=true&w=majority`;

    try {
        const conn = await mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log(`${logTime()}: MongoDB Connected: ${conn.connection.name} on ${conn.connection.host}`);
    } catch (err) {
        console.error(`${logTime()}: MongoDB error: ${err.message}`);

        // exit process with error
        process.exit(1);
    }
};

const closeMongoConnection = async () => {
    try {
        await mongoose.connection.close();
    } catch (err) {
        console.error(err.message);

        // exit process with error
        process.exit(1);
    }
};

module.exports = {
    connectMongoDB,
    closeMongoConnection,
};
