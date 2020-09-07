const express = require('express');
const router = express.Router();
const axios = require('axios');

// authorization middleware
const { auth, ensureAdmin } = require('../middleware/auth');

// IEX Cloud base URL
const iexBaseURL = 'https://cloud.iexapis.com/stable/';

// @route:  GET api/iex/usage
// @desc:   retrieve current month usage for your account
// @access: private
// @role:   admin to-do
router.get('/usage', async (req, res) => {
    const url = iexBaseURL + 'account/usage?token=' + process.env.IEXCLOUD_SECRET_KEY;

    try {
        const iex = await axios.get(url);
        res.json(iex.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/iex/usage
// @desc:   retrieve current month usage for your account
// @access: private
// @role:   admin to-do
router.get('/details', async (req, res) => {
    const url = iexBaseURL + 'account/metadata?token=' + process.env.IEXCLOUD_SECRET_KEY;

    try {
        const iex = await axios.get(url);
        res.json(iex.data);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  get api/iex/validate/:symbol
// @desc:   validate symbol
// @access: private
// @role:   admin
router.get('/validate/:symbol', auth, ensureAdmin, async (req, res) => {
    const url = iexBaseURL + `stock/${req.params.symbol}/company?token=${process.env.IEXCLOUD_PUBLIC_KEY}`;

    try {
        const iex = await axios.get(url);
        res.json(iex.data);
    } catch (err) {
        if (err.response.status == '404') {
            res.status(200).json({ symbol: err.response.data });
        } else {
            res.status(500).send('server error');
        }
    }
});

module.exports = router;
