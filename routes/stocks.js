const express = require('express');
const router = express.Router();

// database models
const Stock = require('../models/Stock.model');

// authorization middleware
const { auth, ensureAdmin } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// @route:  GET api/stocks
// @desc:   get all stock-stector pairs
// @access: private
// @role:   admin
router.get('/', auth, ensureAdmin, async (req, res) => {
    try {
        const stocks = await Stock.findAll({});
        res.json(stocks);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/stocks
// @desc:   create or update stock-sector pair
// @access: private
// @role:   admin
router.post('/', auth, ensureAdmin, async (req, res) => {
    // destructure request body
    let { id, sector, symbol, companyName } = req.body;
    symbol = symbol.toUpperCase(); // make symbol always uppercase

    // determine mode: add or edit, based on presence of id
    const mode = id ? 'edit' : 'add';

    if (mode == 'add') {
        // insert new record
        try {
            const stock = await Stock.create({
                sector,
                symbol,
                companyName,
            });
            res.json(stock);
        } catch (err) {
            console.log('Error during new stock save: ' + err);
            res.status(500).send('server error');
        }
    } else {
        // update existing record
        try {
            await Stock.update({ sector, symbol, companyName }, { where: { id } });
            const stock = await Stock.findOne({ where: { id } });
            res.json(stock);
        } catch (err) {
            console.log('Error during record update: ' + err);
            res.status(500).send('server error');
        }
    }
});

// @route:  DELETE api/stocks/:stockID
// @desc:   delete stock - admin
// @access: private
// @role:   admin
router.delete('/:stockID', auth, ensureAdmin, async (req, res) => {
    try {
        if (await Stock.destroy({ where: { id: req.params.stockID } })) {
            res.json({ msg: 'stock deleted' });
        } else {
            res.status(500).send('server error: S02');
        }
    } catch (error) {
        console.log('Error in record delete :' + error);
        res.status(500).send('server error: S01');
    }
});

// @route:  GET api/stocks/validate/:symbol
// @desc:   check if symbol is in use
// @access: private
// @role:   admin
router.get('/validate/:symbol', auth, ensureAdmin, async (req, res) => {
    try {
        const stock = await Stock.findOne({ where: { symbol: req.params.symbol } });
        res.status(200).json({ stock: stock ? 1 : 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
