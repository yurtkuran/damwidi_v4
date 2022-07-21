const express = require('express');
const router = express.Router();
const axios = require('axios');

// database models
const { Sector } = require('../config/db_MySQL').db;

// authorization middleware
const { auth, ensureAdmin } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// function to round to 'n' digits
const round = (num, digits) => {
    const precision = Math.pow(10, digits);
    return Math.round((num + Number.EPSILON) * precision) / precision;
};

// @route:  GET api/sectors/:sort
// @desc:   get all stock-stector pairs
// @access: private
// @role:   admin
router.get('/:sort', auth, ensureAdmin, async (req, res) => {
    let sortDirection;
    switch (req.params.sort) {
        case 'symbol':
        case 'name':
            sortDirection = 'ASC';
            break;
        case 'weight':
            sortDirection = 'DESC';
            break;
        default:
            sortDirection = 'ASC';
    }

    try {
        const sectors = await Sector.findAll({ order: [[req.params.sort, sortDirection]] });
        res.json(sectors);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/sectors
// @desc:   create or update sector
// @access: private
// @role:   admin
router.post('/', auth, ensureAdmin, async (req, res) => {
    // destructure request body
    let { id, symbol, name, description } = req.body;
    symbol = symbol.toUpperCase(); // make symbol always uppercase

    // determine mode: add or edit, based on presence of id
    const mode = id ? 'edit' : 'add';

    if (mode == 'add') {
        // insert new record
        try {
            const sector = await Sector.create({
                symbol,
                name,
                description,
                type: 'S',
            });
            res.json(sector);
        } catch (err) {
            console.log('Error during new sector save: ' + err);
            res.status(500).send('server error');
        }
    } else {
        // update existing record
        try {
            await Sector.update({ symbol, name, description }, { where: { id } });
            const sector = await Sector.findOne({ where: { id } });
            res.json(sector);
        } catch (err) {
            console.log('Error during record update: ' + err);
            res.status(500).send('server error');
        }
    }
});

// @route:  POST api/sectors/updateSectorWeight
// @desc:   update sector weight
// @access: private
// @role:   admin
router.post('/updateSectorWeight', auth, ensureAdmin, async (req, res) => {
    // destructure request body
    let { id, weight } = req.body;

    // update existing record
    try {
        await Sector.update({ weight }, { where: { id } });
        const sector = await Sector.findOne({ where: { id } });
        res.json(sector);
    } catch (err) {
        console.log('Error during record update: ' + err);
        res.status(500).send('server error');
    }
});

// @route:  POST api/sectors/updateSectorWeightsFromImport
// @desc:   update sector weight
// @access: private
// @role:   admin
router.post('/updateSectorWeightsFromImport', auth, ensureAdmin, async (req, res) => {
    const url = 'https://www.spglobal.com/spdji/en/util/redesign/index-data/get-performance-data-for-datawidget-redesign.dot?indexId=340';

    // import weights and update
    try {
        const spglobal = await axios.get(url); // retrieve weights from SPGlobal
        const indexSectorBreakdown = spglobal.data.indexSectorBreakdownHolder.indexSectorBreakdown;

        await Promise.all(
            indexSectorBreakdown.map(async (sector) => {
                // destructure
                const { sectorDescription, marketCapitalPercentage: weight, effectiveDate, fetchedDate } = sector;

                // find sector in database
                const sectorRecord = await Sector.findOne({ where: { sectorDescription } });

                if (sectorRecord) {
                    await sectorRecord.update({ weight: round(weight * 100, 2), effectiveDate, fetchedDate });
                }
            })
        );

        const sectors = await Sector.findAll({ order: [['weight', 'DESC']] });
        res.json(sectors);
    } catch (err) {
        console.log('Error during sector weights update: ' + err);
        res.status(500).send('server error: S03');
    }
});

// @route:  DELETE api/sectors/:sectorID
// @desc:   delete sector - admin
// @access: private
// @role:   admin
router.delete('/:sectorID', auth, ensureAdmin, async (req, res) => {
    try {
        if (await Sector.destroy({ where: { id: req.params.sectorID } })) {
            res.json({ msg: 'sector deleted' });
        } else {
            res.status(500).send('server error: S02');
        }
    } catch (error) {
        console.log('Error in record delete :' + error);
        res.status(500).send('server error: S01');
    }
});

// @route:  GET api/sectors/validate/:symbol
// @desc:   check if symbol is in use
// @access: private
// @role:   admin
router.get('/validate/:symbol', auth, ensureAdmin, async (req, res) => {
    try {
        const sector = await Sector.findOne({ where: { symbol: req.params.symbol } });
        res.status(200).json({ sector: sector ? 1 : 0 });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
