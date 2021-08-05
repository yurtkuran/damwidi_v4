const express = require('express');
const router = express.Router();
const axios = require('axios');

// authorization middleware
const { auth } = require('../middleware/auth');

// @route:  GET api/alphaVantage/daily/:symbol
// @desc:   retrieve daily candles
// @access: private
// @role:   authenticated
router.get('/daily/:symbol', auth, async (req, res) => {
    const symbol = req.params.symbol;

    if (symbol.toUpperCase() !== 'DAM') {
        var url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${process.env.ALPHAVANTAGE_KEY}&outputsize=full`;
    } else {
        var url = 'http://www.damwidi.com/damwidiMain.php?mode=returnDamwidiOHLC';
    }

    try {
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
