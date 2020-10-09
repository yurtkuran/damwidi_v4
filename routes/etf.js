const express = require('express');
const router = express.Router();

// database models
const ETF = require('../models/ETF');

// authorization middleware
const { auth, ensureAdmin, ensureMember } = require('../middleware/auth');

// @route:  GET api/etf
// @desc:   get all etf's
// @access: private
// @role:   member
router.get('/', auth, ensureMember, async (req, res) => {
    try {
        const etfs = await ETF.find();
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
// @role:   admin to-do
router.post('/components', async (req, res) => {
    try {
        const etf = await ETF.findOne({ _id: req.body.etfID });
        etf.holdings = req.body.components;
        await etf.save();
        res.json(etf);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/etf/:etfID
// @desc:   delete etf
// @access: private
// @role:   admin
router.delete('/:etfID', async (req, res) => {
    try {
        // remove user
        await ETF.findOneAndRemove({ _id: req.params.etfID });
        res.json({ msg: 'etf deleted' });
    } catch (err) {
        console.log('Error in record delete :' + error);
        res.status(500).send('server error: E01');
    }
});

module.exports = router;
