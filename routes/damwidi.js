const express = require('express');
const router = express.Router();
const axios = require('axios');

// database models
const History = require('../models/History.model');
const Value = require('../models/Value.model');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// damwidi_v2 base URL
// const damwidiBaseURL = 'http://172.16.105.129/damwidiMain.php?mode=';
const damwidiBaseURL = 'http://www.damwidi.com/damwidiMain.php?mode=';

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
// @role:   member
router.get('/intraDayData', auth, ensureMember, async (req, res) => {
    const url = damwidiBaseURL + 'returnIntraDayData';

    try {
        const damwidi = await axios.get(url);
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
        const spy = await History.findAll({ attributes: ['date', 'open', 'high', 'low', 'close'], where: { symbol: 'SPY' }, order: [['date', 'ASC']] });
        const value = await Value.findAll({ attributes: ['date', 'open', 'high', 'low', 'close'], order: [['date', 'ASC']] });
        res.json({ spy, value });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
