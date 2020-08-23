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

module.exports = router;
