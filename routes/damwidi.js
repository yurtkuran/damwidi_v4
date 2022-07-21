const express = require('express');
const router = express.Router();
const axios = require('axios');

// database models
const { History, Sector, Stock, Transaction, Value, sequelize, Op } = require('../config/db_MySQL').db;
const ChartConfig = require('../models/ChartConfig');
const ETF = require('../models/ETF');

// bring in local service modules
const { batchQuotes, quote } = require('../services/iexCloud');
const { round, gain: calcGain } = require('../services/round');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');
const { data } = require('cheerio/lib/api/attributes');

// damwidi_v2 base URL
const damwidiBaseURL = 'http://www.damwidi.com/damwidiMain.php?mode=';

// function to calculate damwidi value
const calculateDamwidiValue = (sectors, prices) => {
    let damValue = 0;
    let validPrice = true;

    // loop through sectors
    for (const sector of sectors) {
        const { symbol, shares } = sector;
        if (sector.type === 'C') {
            damValue += parseFloat(sector.basis); // add in cash
        } else if (sector.type !== 'F' && sector.shares > 0) {
            if (prices?.[symbol] !== undefined && prices?.[symbol].price !== 0) {
                realTime = true;
                damValue += shares * prices?.[symbol].price;
            } else if (quotes?.[symbol] !== undefined && quotes?.[symbol].price !== 0) {
                damValue += shares * quotes?.[symbol].price;
            } else {
                return { validPrice: false };
            }
        }
    }
    return { damValue: Math.round((damValue + Number.EPSILON) * 100) / 100, validPrice };
};

// @route:  GET api/damwidi/unstick // todo
// @desc:   retrieve unstick log
// @access: private
// @role:   admin
router.get('/unstick', auth, ensureAdmin, async (req, res) => {
    const url = damwidiBaseURL + 'returnUnstickLog';

    try {
        const damwidi = await axios.get(url);
        res.json(damwidi.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/tradeHistory
// @desc:   retrieve trade history
// @access: private
// @role:   member
router.get('/tradeHistory', auth, ensureMember, async (req, res) => {
    try {
        const mask = Array.from('SB');
        const damwidi = await Transaction.findAll({
            order: [['transaction_date', 'DESC']],
            where: { type: { [Op.in]: mask } },
            attributes: {
                exclude: ['id', 'updated'],
            },
            raw: true,
        });
        console.log(damwidi);
        res.json(damwidi);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/timeframeData
// @desc:   retrieve sector-timeframe data
// @access: private
// @role:   member
router.get('/timeframeData', auth, ensureMember, async (req, res) => {
    try {
        const mask = Array.from('SIFK');
        const damwidi = await Sector.findAll({
            order: [[sequelize.fn('FIELD', sequelize.col('type'), 'F', 'I', 'S', 'K')]],
            where: { type: { [Op.in]: mask } },
            attributes: {
                exclude: ['id', 'effectiveDate', 'fetchedDate', 'createdAt', 'updatedAt'],
            },
            raw: true,
        });
        res.json(damwidi);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/aboveBelowData
// @desc:   retrieve above-below-rs data
// @access: private
// @role:   member
router.get('/aboveBelowData/:timeframe', auth, ensureMember, async (req, res) => {
    // timeframe data
    const timeframes = {
        '1wk': { period: '1wk', lengthWeeks: 1, lengthDays: 5 },
        '2wk': { period: '2wk', lengthWeeks: 2, lengthDays: 10 },
        '4wk': { period: '4wk', lengthWeeks: 4, lengthDays: 20 },
        '8wk': { period: '8wk', lengthWeeks: 8, lengthDays: 40 },
        '1qtr': { period: '1qtr', lengthWeeks: 13, lengthDays: 65 },
        '1yr': { period: '1yr', lengthWeeks: 52, lengthDays: 260 },
    };

    try {
        // timeframe length
        let length;
        if (req.params.timeframe !== 'ytd') {
            length = timeframes[req.params.timeframe].lengthDays;
        } else {
            const startDate = `${new Date().getFullYear()}-01-01`;
            const [results, metadata] = await sequelize.query(
                `SELECT COUNT(*) AS qty FROM data_history WHERE symbol = 'SPY' AND date >= '${startDate}'`,
                { type: sequelize.QueryTypes.SELECT }
            );
            length = results.qty + 1;
        }

        // retrieve sectors & SPY
        const sectors = await Sector.findAll({
            order: [['symbol']],
            where: { [Op.or]: [{ type: 'S' }, { [Op.and]: [{ type: 'I' }, { symbol: 'SPY' }] }] },
            attributes: {
                exclude: ['id', 'effectiveDate', 'fetchedDate', 'createdAt', 'updatedAt'],
            },
            raw: true,
        });

        // loop through sectors, retrieve history data, create above/below arrays
        let sectorGain = [];
        for (sector of sectors) {
            const { symbol, name } = sector;
            historicalData = await History.findAll({
                where: { symbol },
                order: [['date', 'DESC']],
                attributes: {
                    exclude: ['id'],
                },
                limit: length,
                raw: true,
            });
            historicalData.reverse();

            // calculate sector gain
            let gain = 1;
            const gainData = historicalData.map((item, idx, data) => {
                const { close } = item;
                if (idx === 0) return gain;

                gain *= calcGain(close, data[idx - 1].close);
                return round(gain, 4);
            });
            sectorGain.push({ symbol, name, data: gainData });
        }
        // create label array
        const labels = historicalData.map((data) => data.date);

        // sort data array low to high, create above/below arrays
        sectorGain.sort((a, b) => a.data[length - 1] - b.data[length - 1]);
        const spyIndex = sectorGain.findIndex((item) => item.symbol === 'SPY');
        const above = sectorGain.slice(spyIndex).reverse();
        const below = sectorGain.slice(0, spyIndex + 1);

        // create RS array
        let rs = [];
        for (sector of sectorGain) {
            const { symbol, name, data } = sector;

            // calculate sector gain
            const rsData = data.map((gain, idx) => {
                return round(100 * (gain / sectorGain[spyIndex].data[idx]), 4);
            });
            rs.push({ symbol, name, data: rsData });
        }
        rs.reverse();

        // retrieve chart configs
        const ChartConfigs = await ChartConfig.find({}).select('-_id');

        res.json({ labels, above, below, rs, ChartConfigs });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/history
// @desc:   retrieve historical SPY and DAM data
// @access: private
// @role:   authenticated
router.get('/history', auth, async (req, res) => {
    try {
        const spy = await History.findAll({
            attributes: ['date', 'open', 'high', 'low', 'close'],
            where: { symbol: 'SPY' },
            order: [['date', 'ASC']],
        });
        const value = await Value.findAll({ attributes: ['date', 'open', 'high', 'low', 'close'], order: [['date', 'ASC']] });
        res.json({ spy, value });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/openPositions
// @desc:   retrieve open positions other than sectors, indicies and cash
// @access: private
// @role:   authenticated
router.get('/openPositions', auth, async (req, res) => {
    const mask = Array.from('KCIS');
    try {
        const openPositions = await Sector.findAll({
            attributes: ['symbol', 'shares', 'previous', 'type'],
            where: { shares: { [Op.gt]: 0 }, type: { [Op.in]: mask } },
            order: [['symbol', 'ASC']],
        });
        res.json(openPositions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/openPositionsDetail
// @desc:   retrieve details on open positions including open lots
// @access: private
// @role:   member
router.get('/openPositionsDetail', auth, ensureMember, async (req, res) => {
    const mask = Array.from('KCIS');
    try {
        const transactions = await Transaction.findAll({
            order: [['date', 'ASC']],
        });

        const spyData = await History.findAll({
            attributes: ['date', 'close'],
            where: { symbol: 'SPY' },
            order: [['date', 'ASC']],
        });

        let spy = {};
        spyData.map(({ date, close }) => {
            spy[date] = {
                close,
            };
        });

        const { latestPrice: spyPrice } = await quote('SPY');

        // loop through data return open positions (symbol and share count)
        let openPositions = {};
        transactions.forEach(async ({ type, symbol, date, shares, amount }) => {
            const shareQty = round(parseFloat(shares), 5);

            switch (type) {
                // purchase
                case 'B':
                    const purchase = {
                        date,
                        priceBasis: round(Math.abs(amount / shares), 3),
                        spyBasis: spy[date].close,
                        spyGain: round((100 * (spyPrice - spy[date].close)) / spy[date].close, 2),
                    };

                    if (Object.keys(openPositions).includes(symbol)) {
                        // existing symbol
                        openPositions[symbol].shares = round(openPositions[symbol].shares + shareQty, 5);
                        openPositions[symbol].purchases.push(purchase);
                    } else {
                        // new symbol
                        openPositions[symbol] = {
                            shares: shareQty,
                            purchases: [purchase],
                        };
                    }
                    break;

                // sell
                case 'S':
                    openPositions[symbol].shares = round(openPositions[symbol].shares + shareQty, 5);

                    // remove symbol from object when share count = 0
                    if (round(openPositions[symbol].shares, 5) === 0) delete openPositions[symbol];

                    break;
                default:
                    break;
            }
        });
        res.json(openPositions);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/performance
// @desc:   retrieve all rows from performance table and batch quotes
// @access: private
// @role:   member
router.get('/performance', auth, ensureMember, async (req, res) => {
    try {
        // retrieve sectors
        const sectors = await Sector.findAll({
            order: [['symbol', 'ASC']],
            attributes: {
                exclude: ['id', 'effectiveDate', 'fetchedDate', 'createdAt', 'updatedAt'],
                include: ['Stock.sector'],
            },
            raw: true,
            include: [
                {
                    model: Stock,
                    attributes: [],
                },
            ],
        });

        // create comma seperated list of symbols and retrieve latest prices
        const symbols = sectors.filter((symbol) => symbol.type !== 'C' && symbol.type !== 'F').map((symbol) => symbol.symbol);

        // add in major indicies if needed
        const indicies = ['SPY', 'QQQ', 'DIA'];
        indicies.map((index) => {
            if (symbols.findIndex((symbol) => symbol === index) === -1) symbols.push(index);
            return true;
        });

        const prices = await batchQuotes(symbols.join());

        // add in DAM data
        const previous = await Value.findOne({ attributes: ['account_value'], order: [['date', 'DESC']] });

        const { damValue, validPrice } = calculateDamwidiValue(sectors, prices);

        prices.DAM = {
            symbol: 'DAM',
            price: validPrice ? damValue : 0,
            previousClose: parseFloat(previous.account_value),
        };

        const damIndex = sectors.findIndex((sector) => sector.symbol === 'DAM');
        sectors[damIndex] = { ...sectors[damIndex], previous: parseFloat(previous.account_value) };

        res.json({ sectors, prices });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// method: GET
// route:  api/damwidi/allocation
// desc:   retrieve allocation table data
// access: private
// role:   member
router.get('/allocation', auth, ensureMember, async (req, res) => {
    const insertIntoAllocationData = (symbol, sector, data, prices, damValue, spyValue) => {
        const { name, description, type, basis, shares, weight } = data;

        const price = shares > 0 && type !== 'C' ? prices[symbol].price : 0;
        const currentValue = shares * price;
        const change = shares * (price - basis);
        let implied = 0;

        let allocation = {};
        switch (type) {
            case 'C': // cash
                allocation = {
                    last: basis,
                    currentValue: basis,
                    basis,
                    shares: 1,
                    change: 0,
                    allocation: 100 * (basis / damValue),
                };
                break;
            case 'S': // sector
            case 'K': // stock
            case 'I': // index
                implied = (weight / 100) * spyValue + currentValue;
                allocation = {
                    last: price,
                    currentValue,
                    basis,
                    shares,
                    allocation: 100 * (currentValue / damValue),
                    change,
                    changePercent: shares ? 100 * (price / basis - 1) : 0,
                };
                break;
            case 'Y': // summary row
                const { currentValue: summaryCurrentValue, change: summaryChange } = data;
                implied = (weight / 100) * spyValue + summaryCurrentValue;
                allocation = {
                    currentValue: summaryCurrentValue,
                    allocation: 100 * (summaryCurrentValue / damValue),
                    change: summaryChange,
                    changePercent: 100 * (summaryChange / summaryCurrentValue - summaryChange),
                };

                break;
            default:
                break;
        }

        if (type === 'S' || type === 'Y') {
            allocation = {
                ...allocation,
                weight,
                implied,
                impliedPercent: 100 * (implied / damValue),
            };
        }

        return {
            symbol,
            sector,
            name,
            description,
            type,
            ...allocation,
        };
    };

    try {
        // retrieve all symbols where shares > 0
        const positions = await Sector.findAll({
            order: [['symbol', 'ASC']],
            where: { shares: { [Op.gt]: 0 }, type: { [Op.in]: Array.from('CKIS') } },
            raw: true,
        });
        const symbols = positions.filter((sector) => sector.type !== 'C').map((sector) => sector.symbol);

        // add in SPY indicies if needed
        if (symbols.findIndex((symbol) => symbol === 'SPY') === -1) symbols.push('SPY');

        // retrieve prices
        const prices = await batchQuotes(symbols.join());

        // damwidi value
        const { damValue } = calculateDamwidiValue(positions, prices);

        // retrieve stocks & ETF's
        const stocks = await sequelize.query('call stock_allocation');

        // retrieve sectors, cash and indicies
        const mask = Array.from('CIS');
        const sectors = await Sector.findAll({
            // order: [['symbol', 'ASC']],
            order: [[sequelize.fn('FIELD', sequelize.col('type'), 'C', 'I', 'S')], ['weight', 'DESC'], ['sector', 'ASC'], ['`sector`']],
            where: { type: { [Op.in]: mask } },
            attributes: {
                exclude: ['id', 'effectiveDate', 'fetchedDate', 'createdAt', 'updatedAt'],
                include: ['Stock.sector'],
            },
            raw: true,
            include: [
                {
                    model: Stock,
                    attributes: [],
                },
            ],
        });

        // spy value
        const spyShares = sectors[sectors.findIndex((sector) => sector.symbol === 'SPY')].shares;
        const spyValue = spyShares * prices['SPY'].price;

        let allocation = {};
        sectors.map((sectorData) => {
            const { symbol, name, weight, type } = sectorData;
            allocation[symbol] = insertIntoAllocationData(symbol, symbol, sectorData, prices, damValue, spyValue);
            const { change, currentValue } = allocation[symbol];

            // summary data
            let sectorSummary = false;
            const summary = {
                type: 'Y', // Y = summarY
                name,
                description: name,
                currentValue,
                change,
                weight,
            };

            // loop through stocks
            stocks.map((stock) => {
                const { sector, symbol: stockSymbol, shares, basis } = stock;
                if (sector === symbol) {
                    sectorSummary = true;
                    positionData = positions.find((position) => position.symbol === stockSymbol);
                    allocation[stockSymbol] = insertIntoAllocationData(stockSymbol, sector, positionData, prices, damValue, spyValue);

                    // update summary data
                    summary.currentValue += allocation[stockSymbol].currentValue;
                    summary.change += allocation[stockSymbol].change;
                }
            });

            // add sumary row, if needed
            if (sectorSummary) {
                const summarySymbol = `${symbol}_Total`;
                allocation[summarySymbol] = insertIntoAllocationData(summarySymbol, summarySymbol, summary, prices, damValue, spyValue);
            }

            // convert setor only row to summary
            if (!sectorSummary && type === 'S') allocation[symbol].type = 'Y';
        });

        // convert to array
        let allocationData = [];
        for (symbol in allocation) allocationData.push(allocation[symbol]);

        // create damwidi data
        const damData = {
            symbol: 'DAM',
            description: 'Damwidi',
            currentValue: damValue,
        };

        res.json({ allocationData, damData, prices });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
