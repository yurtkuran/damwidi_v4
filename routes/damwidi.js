const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Op } = require('sequelize');

// database models
const History = require('../models/History.model');
const Value = require('../models/Value.model');
const Sector = require('../models/Sector.model');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// damwidi_v2 base URL
const damwidiBaseURL = 'http://localhost:8080/damwidiMain.php?mode=';
// const damwidiBaseURL = 'http://www.damwidi.com/damwidiMain.php?mode=';

// @route:  GET api/damwidi/unstick
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
    const url = damwidiBaseURL + 'returnTransactions';

    try {
        const damwidi = await axios.get(url);
        res.json(damwidi.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/damwidi/intraDayData
// @desc:   retrieve intraday data
// @access: private
// @role:   verified, member or admin; data returned will vary by role
router.get('/intraDayData', auth, async (req, res) => {
    const url = damwidiBaseURL + 'returnIntraDayData';

    try {
        const damwidi = await axios.get(url);
        if (!req.user.isMember) {
            // rebuild allocation data removing amounts and shares for non-member viewing
            let trimmedAllocationTable = {};
            for (const item in damwidi.data.allocationTable) {
                const { name, impliedPercent, allocation, type, symbol } = damwidi.data.allocationTable[item];
                trimmedAllocationTable[item] = {
                    name,
                    impliedPercent,
                    allocation,
                    type,
                    symbol,
                };
            }
            damwidi.data.allocationTable = trimmedAllocationTable;

            // rebuild portfolioTable data removing amounts and shares for non-member viewing
            let trimmedPortfolioTable = {};
            for (const item in damwidi.data.portfolioTable) {
                const { sector } = damwidi.data.portfolioTable[item];
                trimmedPortfolioTable[item] = {
                    sector,
                };
            }
            damwidi.data.portfolioTable = trimmedPortfolioTable;

            // remove other data for non-member viewing
            delete damwidi.data.intraDay;
            delete damwidi.data.performanceData;
            delete damwidi.data.heatMapData;
        }
        res.json(damwidi.data);
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
    const url = `${damwidiBaseURL}returnSectorTimeframePerformanceData&version=v4`;

    try {
        const damwidi = await axios.get(url);
        res.json(damwidi.data);
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
    const url = `${damwidiBaseURL}returnAboveBelow&timeframe=${req.params.timeframe}&version=v4`;

    try {
        const damwidi = await axios.get(url);
        res.json(damwidi.data);
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

module.exports = router;
