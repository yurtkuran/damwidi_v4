// clear console
console.clear();

// configure dotenv - bring in configuration variables, passwords and keys
require('dotenv').config({ path: '../.env' });

// bring in local modules
const connectDB = require('../config/db');

// connect to database
connectDB.connectMongoDB(); // mongo database

// database models
const ETF = require('../models/ETF');
const Stock = require('../models/Stock');

const poppulateHoldings = async () => {
    const etfs = await retrieveETFs();

    const etfList = etfs.map(async (etf) => {
        console.log('\x1b[31m%s\x1b[0m', etf.symbol);

        let holdings = etf.toObject().holdings; // convert mongoDB doc to object

        for (let holding of holdings) {
            const stock = await lookUpStock(holding.symbol);

            holding = { ...holding, stock: stock._id };
            holdings = holdings.map((holdingItem) => (holdingItem._id === holding._id ? holding : holdingItem));
        }

        try {
            etf.holdings = holdings;
            await etf.save();
        } catch (err) {
            console.error(err.message);
        }
    });

    Promise.all(etfList).then(() => {
        console.log('done');
        connectDB.closeMongoConnection();
    });
};

const retrieveETFs = async (filter = null) => {
    try {
        // const etfs = await ETF.find();
        const etfs = await ETF.find(filter).populate('holdings.stock', '-history -__v -createdAt -updatedAt -_id');

        return etfs;
    } catch (err) {
        console.error(err.message);
        console.error('server error');
    }
};

const lookUpStock = async (symbol) => {
    try {
        const stock = await Stock.findOne({ symbol });
        return stock;
    } catch (err) {
        console.error(err.message);
        console.error('server error');
    }
};

const refactorHoldings = async () => {
    const etfs = await retrieveETFs({ symbol: 'ARKW' });

    etfs.map(async (etf) => {
        console.log('\x1b[31m%s\x1b[0m', etf.symbol);

        let holdings = etf.toObject().holdings; // convert mongoDB doc to object

        for (let holding of holdings) {
            const { _id, weight, stock } = holding;
            const { symbol, ...stockDetail } = stock;

            holding = { _id, symbol, weight, ...stockDetail };

            holdings = holdings.map((holdingItem) => (holdingItem._id === holding._id ? holding : holdingItem));
            // break;
        }
        console.log(holdings);
    });

    Promise.all(etfs).then(() => {
        console.log('done');
        connectDB.closeMongoConnection();
    });
};

const populateComponentOf = async () => {
    // const etfs = await retrieveETFs({ symbol: 'ARKW' });
    const etfs = await retrieveETFs();

    for (let etf of etfs) {
        console.log('\x1b[31m%s\x1b[0m', etf.symbol);

        let holdings = etf.toObject().holdings; // convert mongoDB doc to object

        for (let holding of holdings) {
            try {
                var stock = await lookUpStock(holding.symbol);

                if (!stock.componentOf.includes(etf.symbol)) {
                    // add component
                    stock.componentOf.push(etf.symbol);
                    console.log(`  ${stock.symbol}+`);
                    await stock.save();
                }
            } catch (err) {
                console.error(err.message);
            }
        }
    }

    console.log('\ndone');
    connectDB.closeMongoConnection();
};

populateComponentOf();
