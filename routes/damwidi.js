const express = require('express');
const router = express.Router();
const axios = require('axios');

// database models
const Sector = require('../models/Sector.model');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// damwidi_v2 base URL
const damwidiBaseURL = 'http://172.16.105.129/damwidiMain.php?mode=';
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

module.exports = router;
