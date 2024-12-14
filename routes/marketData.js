const express = require('express');
const router = express.Router();
const axios = require('axios');

// database models
const SP500 = require('../models/SP500');
const Stock = require('../models/Stock');

// bring in local service modules
const { scrapeSlickCharts, scrapeStockMBA } = require('../services/scrapeSPData');
const { company, keyStats, intraDay } = require('../services/iexCloud');
const { quote, profile } = require('../services/polygon');
const { scrapeFidelity } = require('../services/scrapeGics');
const { metrics } = require('../services/finnHub');

// authorization middleware
const { auth, ensureAdmin, ensureMember, ensureVerified } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');
const { PromiseProvider } = require('mongoose');

// damwidi_v2 base URL
// const damwidiBaseURL = 'http://localhost:8080/damwidiMain.php?mode=';
const damwidiBaseURL = 'http://www.damwidi.com/damwidiMain.php?mode=';

// @route:  GET api/marketData/sp500
// @desc:   retrieve S&P500 companies
// @access: private
// @role:   member
router.get('/sp500', auth, ensureMember, async (req, res) => {
    try {
        // retrieve current S&P 500 list (from MongoDB)
        const sp500 = await SP500.find().sort('-weight');
        res.json(sp500);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/sp500/refresh
// @desc:   retrieve S&P500 companies
// @access: private
// @role:   admin
router.get('/sp500/refresh', auth, ensureAdmin, async (req, res) => {
    res.status(202);

    var removed = [];
    var append = [];

    try {
        // retrieve current S&P 500 list (from MongoDB)
        const sp500 = await SP500.find().select('symbol');

        // scrape S&P 500 list from slick charts
        const spy = await scrapeSlickCharts();

        // scrape S&P 500 list from stock market MBA
        const spyMBA = await scrapeStockMBA();

        // remove symbols from database that are not longer in S&P500
        for (const s of sp500) {
            const stock = spy.find((sp) => sp.symbol === s.symbol); // find symbol
            if (!stock) {
                removed.push(s.symbol);
                await SP500.findOneAndRemove({ _id: s._id });
            }
        }

        // update S&P500 database
        for (const s of spy) {
            // retrieve shares outstanding from IEX
            const sharesOutstanding = await keyStats(s.symbol, 'sharesOutstanding');

            // find symbol in stock market MBA data
            const mba = spyMBA.find((sp) => sp.symbol === s.symbol);

            // find symbol in local database (MongoDB)
            const stock = sp500.find((sp) => sp.symbol === s.symbol);
            if (stock) {
                // update
                const SP500fields = {
                    weight: s.weight,
                    sectorMBA: mba && mba.sector ? mba.sector : '',
                    marketCap: mba && mba.marketCap ? mba.marketCap : 0,
                    sharesOutstanding: sharesOutstanding && typeof sharesOutstanding === 'number' ? sharesOutstanding : 0,
                };
                await SP500.findOneAndUpdate({ _id: stock._id }, { $set: SP500fields });
                // console.log(SP500fields);
            } else {
                // add - stock not currently in database, retrive full details and add
                append.push(s.symbol);

                // retrieve IEX company information
                const iex = await company(s.symbol);
                const { companyName, industry, website, exchange } = iex;

                // build SP500 object
                const SP500fields = {
                    symbol: s.symbol,
                    weight: s.weight,
                    name: companyName ? companyName : '',
                    sectorMBA: mba.sector ? mba.sector : '',
                    marketCap: mba.marketCap ? mba.marketCap : '',
                    sectorIEX: iex.sector ? iex.sector : '',
                    industryIEX: industry ? industry : '',
                    sharesOutstanding: sharesOutstanding && typeof sharesOutstanding === 'number' ? sharesOutstanding : 0,
                    website: website ? website : '',
                    exchange: exchange ? exchange : '',
                };

                member = new SP500(SP500fields);
                await member.save();
            }
            // break;
        }
        console.log('--- S&P500 Refresh Complete : ' + new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''));
        res.json({ removed, append });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/marketData/updateStockInfo
// @desc:   update stock data
// @access: private
// @role:   admin
router.post('/updateStockInfo', auth, ensureAdmin, async (req, res) => {
    res.status(202);

    try {
        // retrieve stocks (from MongoDB)
        let stocks = await Stock.find();

        for (const stock of stocks) {
            let { symbol, sector, industry } = stock;
            // console.log(sector);
            if (typeof sector === 'undefined' || sector === '' || typeof industry === 'undefined' || industry === null) {
                // scrape fidelity
                [sector, industry] = await scrapeFidelity(symbol);
            }

            // retrieve IEX company information
            const iexCompany = await company(symbol);
            const { companyName, website, exchange, description, country } = iexCompany;

            // retrieve IEX key stats
            const iexKeyStats = await keyStats(symbol);
            const {
                sharesOutstanding,
                peRatio,
                year5ChangePercent,
                year2ChangePercent,
                year1ChangePercent,
                ytdChangePercent,
                month6ChangePercent,
                month3ChangePercent,
                month1ChangePercent,
                day30ChangePercent,
                day5ChangePercent,
            } = iexKeyStats;

            if (sector === '') {
                sector = iexCompany.sector;
                industry = iexCompany.industry;
            }

            const stockData = {
                sector,
                industry,
                companyName,
                website,
                exchange,
                description,
                country,
                sharesOutstanding,
                peRatio,
                year5ChangePercent,
                year2ChangePercent,
                year1ChangePercent,
                ytdChangePercent,
                month6ChangePercent,
                month3ChangePercent,
                month1ChangePercent,
                day30ChangePercent,
                day5ChangePercent,
            };

            if (sector === '') {
                stockData.sector = iexCompany.sector;
                stockData.industry = iexCompany.industry;
            }

            await Stock.findOneAndUpdate({ symbol }, stockData);
        }

        stocks = await Stock.find();
        res.status(200).json(stocks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/stockInfo
// @desc:   get all stocks from MongoDB
// @access: private
// @role:   member
// @source: mongoDB document
router.get('/stockInfo', auth, ensureMember, async (req, res) => {
    try {
        // retrieve stocks (from MongoDB)
        let stocks = await Stock.find();
        res.status(200).json(stocks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/quote/:symbol
// @desc:   retrieve intraday quote
// @access: private
// @role:   verified
// @source: polygon
router.get('/quote/:symbol', auth, ensureVerified, async (req, res) => {
    const symbol = req.params.symbol;
    let quoteData = {};
    try {
        if (symbol !== 'DAM') {
            quoteData = await quote(req.params.symbol);
            
            const stockMetrics = await metrics(req.params.symbol);
            quoteData.week52High = stockMetrics.data["52WeekHigh"];
            quoteData.week52Low  = stockMetrics.data["52WeekLow"];

        } else {
            const url = damwidiBaseURL + 'returnIntraDayData';
            const damwidi = await axios.get(url);
            const { currentValue, prevClose, gain } = damwidi.data.intraDay.DAM;

            quoteData = {
                symbol: 'DAM',
                latestPrice: currentValue,
                change: currentValue - prevClose,
                changePercent: gain / 100,
                previousClose: prevClose,
            };
        }
        res.json(quoteData);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/intraday/:symbol
// @desc:   retrieve intraday candle
// @access: private
// @role:   member
// @source: iex - https://iexcloud.io/docs/api/#intraday-prices
router.get('/intraday/:symbol', auth, ensureMember, async (req, res) => {
    try {
        iex = await intraDay(req.params.symbol);
        res.json(iex);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/keystats/:symbol?stat=
// @desc:   retrieve key all key stats or a specific keystat (e.g. week52high) from IEX Cloud
// @access: private
// @role:   member
// @source: iex - https://iexcloud.io/docs/api/#stats-basic
router.get('/keystats/:symbol', auth, ensureMember, async (req, res) => {
    const stat = req.query.stat;
    try {
        iex = await keyStats(req.params.symbol, stat);
        res.json(iex);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/profile/:symbol
// @desc:   retrieve general company information (e.g. web url) from Finnhub
// @access: private
// @role:   authenticated
// @source: polygon 
router.get('/profile/:symbol', auth, async (req, res) => {
    const stat = req.query.stat;
    try {
        data = await profile(req.params.symbol, stat);
        res.json(data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/marketData/profile/:symbol
// @desc:   retrieve general company information (e.g. web url) from Finnhub
// @access: private
// @role:   authenticated
// @source: polygon & finnhub
router.get('/metrics/:symbol', auth, async (req, res) => {
    const stat = req.query.stat;
    try {
        const stockMetrics = await metrics(req.params.symbol, stat);
        const stockProfile = await profile(req.params.symbol, stat);
        res.json({stockMetrics, stockProfile});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
