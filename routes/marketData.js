const express = require('express');
const router = express.Router();

// database models
const SP500 = require('../models/SP500');

// bring in local service modules
const { scrapeSlickCharts, scrapeStockMBA } = require('../services/scrapeSPData');
const { company, keyStats } = require('../services/iexCloud');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');
const { PromiseProvider } = require('mongoose');

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

// @route:  GET api/marketData/sp500
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

router.get('/test/:symbol', async (req, res) => {
    const stat = req.query.stat;
    try {
        iex = await keyStats(req.params.symbol, stat);
        console.log(typeof iex);
        res.json(iex);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

router.get('/test2/:symbol', async (req, res) => {
    try {
        // scrape S&P 500 list from stock market MBA
        const spyMBA = await scrapeStockMBA();

        const obj = spyMBA.find((o) => o.symbol === req.params.symbol.toUpperCase());

        // res.json(spyMBA);
        console.log(obj.sector);
        console.log(obj.market);
        res.json(obj ? obj : 'not found');
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
