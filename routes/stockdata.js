const express = require('express');
const router = express.Router();

// database models
const Stock = require('../models/Stock');

// authorization middleware
const { auth, ensureAdmin } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// @route:  GET api/stockdata
// @desc:   get all stocks
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

// @route:  POST api/stockdata
// @desc:   create or update stock
// @access: private
// @role:   admin
router.post('/', auth, ensureAdmin, async (req, res) => {
    // destructure request body
    let { _id, symbol, sector, industry } = req.body;
    symbol = symbol.toUpperCase(); // make symbol always uppercase

    // determine mode: add or edit, based on presence of id
    const mode = _id ? 'edit' : 'add';

    if (mode == 'add') {
        // insert new record
        try {
            stock = new Stock({
                symbol,
                sector,
                industry,
            });

            // save to database
            stock = await stock.save();
            res.json(stock);
        } catch (err) {
            console.log('Error during new stock save: ' + err);
            res.status(500).send('server error');
        }
    } else {
        // update existing record
        try {
            stock = await Stock.findOneAndUpdate({ _id }, { $set: { symbol, sector, industry } }, { new: true });
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

module.exports = router;
