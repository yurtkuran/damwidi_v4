const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// database models
const User = require('../models/User');

// @route   POST api/confirm
// @desc    handle email confirmation link
// @access  public
// @role    all
router.post('/', async (req, res) => {
    jwt.verify(req.body.token, process.env.SECRET, async (err, authData) => {
        if (err) {
            switch (err.name) {
                case 'TokenExpiredError':
                    msg = 'Verificaion link expired. Please enter email and password to resend';
                    return res.status(401).json({ msg, message: err.message, name: err.name });
                case 'JsonWebTokenError':
                    msg = 'Invalid Token!';
                    return res.status(401).json({ msg, message: err.message, name: err.name });
                default:
                    return res.status(500).json({ msg: 'server error' });
            }
        } else {
            try {
                user = await User.findByIdAndUpdate(authData.id, { isVerified: true });

                // check if user exists
                if (user !== null) {
                    // console.log(user);
                    res.status(201).json({ msg: 'email confirmation successful' });
                } else {
                    res.status(404).json({ msg: 'user not found' });
                }
            } catch (err) {
                console.error(err.message);
                res.status(500).send('server error');
            }
        }
    });
});

module.exports = router;
