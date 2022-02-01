const express = require('express');
const router = express.Router();

// database models
const ETF = require('../models/ETF');
const Stock = require('../models/Stock');

// bring in local service modules
const { updateComponentOf, reviseComponentOf } = require('../services/updateEtfData');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// @route:  GET api/etf
// @desc:   get all etf's
// @access: private
// @role:   member
router.get('/', auth, ensureMember, async (req, res) => {
    try {
        const etfs = await ETF.find().sort({ symbol: 'asc' }).populate('holdings.stock', '-history -__v -createdAt -updatedAt -_id');
        res.json(etfs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/etf
// @desc:   create or update etf
// @access: private
// @role:   admin
router.post('/', auth, ensureAdmin, async (req, res) => {
    // destructure request body
    let { _id, symbol, description, weightType } = req.body;

    // determine mode: add or edit, based on presence of id
    const mode = _id ? 'edit' : 'add';

    if (mode === 'add') {
        // insert new record
        try {
            etf = new ETF({
                symbol,
                description,
                weightType,
            });

            // save to database
            etf = await etf.save();
            res.json(etf);
        } catch (err) {
            console.log('Error during new stock save: ' + err);
            res.status(500).send('server error');
        }
    } else {
        // update existing record
        try {
            etf = await ETF.findById({ _id });

            // change componentOf field for holdings when ETF symbol changes
            if (etf.symbol !== symbol) updateComponentOf(etf, symbol);

            // update & save etf
            etf = await ETF.findOneAndUpdate({ _id }, { $set: { symbol, description, weightType } }, { new: true });

            res.json(etf);
        } catch (err) {
            console.log('Error during record update: ' + err);
            res.status(500).send('server error');
        }
    }
});

// @route:  POST api/etf/components
// @desc:   create or update etf components
// @access: private
// @role:   admin
router.post('/components', auth, ensureAdmin, async (req, res) => {
    // destructure req.body
    const { etfID, etf } = req.body;

    // mongoDB query options
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    var components = req.body.components;
    for (const component of components) {
        // destructure
        const { symbol } = component;

        try {
            const stock = await Stock.findOneAndUpdate({ symbol }, { symbol }, options);

            // add ETF to componentOf array
            if (!stock.componentOf.includes(etf)) {
                stock.componentOf.push(etf);
                await stock.save();
            }

            // add stock id to component
            components = components.map((component) => (component.symbol === stock.symbol ? { ...component, stock: stock._id } : component));
        } catch (err) {
            console.error(err.message);
            res.status(500).send('server error');
        }
    }

    try {
        const etf = await ETF.findOne({ _id: etfID });

        // set weights for market weight ETFs to-do
        if (etf.weightType === 'market') {
            components = components.map((component) =>
                isNaN(component.weight) || component.weight === '' || component.weight === null ? { ...component, weight: 0 } : component
            );
        }

        etf.holdings = components;
        await etf.save();

        // check for and remove etf from componentOf for stocks no longer in ETF holdings
        reviseComponentOf(etf);

        res.json(etf);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
    // res.status(200).send('ok');
});

// @route:  DELETE api/etf/:etfID
// @desc:   delete etf
// @access: private
// @role:   admin
router.delete('/:etfID', auth, ensureAdmin, async (req, res) => {
    try {
        // remove ETF from componentOf for all holdings
        etf = await ETF.findById({ _id: req.params.etfID });
        reviseComponentOf(etf, true);

        // remove ETF
        await ETF.findOneAndRemove({ _id: req.params.etfID });
        res.json({ msg: 'etf deleted' });
    } catch (err) {
        console.log('Error in record delete :' + error);
        res.status(500).send('server error: E01');
    }
});

// @route:  GET api/etf/validate/:symbol
// @desc:   check if symbol is in use
// @access: private
// @role:   admin
router.get('/validate/:symbol', auth, ensureAdmin, async (req, res) => {
    try {
        // const etf = await ETF.find({ where: { symbol: req.params.symbol } });
        const etf = await ETF.findOne({ symbol: req.params.symbol.toUpperCase() });
        res.status(200).json({ etf: etf ? 1 : 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
