const express = require('express');
const router = express.Router();
const axios = require('axios');

// bring in local dependencies
const { returnDamwidiOHLC } = require('../services/damwidiHistory');

// authorization middleware
const { auth } = require('../middleware/auth');

// @route:  GET api/alphaVantage/daily/:symbol
// @desc:   retrieve daily candles
// @access: private
// @role:   authenticated
router.get('/daily/:symbol', auth, async (req, res) => {
    const symbol = req.params.symbol;
    const apiFunction = 'TIME_SERIES_DAILY';

    try {
        if (symbol.toUpperCase() === 'DAM') {
            const daily = await returnDamwidiOHLC();
            return res.json(daily);
        }

        const url = `https://www.alphavantage.co/query?function=${apiFunction}&symbol=${symbol}&apikey=${process.env.ALPHAVANTAGE_KEY}&outputsize=compact`;
        const daily = await axios.get(url);
        if (!daily.data.hasOwnProperty('Error Message')) {
            res.json(daily.data);
        } else {
            res.json({ error: 'symbol not found' });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
