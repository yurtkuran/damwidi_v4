const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

// database models
const User = require('../models/User');

// authorization middleware
const { auth } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// user validation
const userValidation = [check('email', 'Please include a valid email').isEmail(), check('password', 'Password is required').exists()];

// @route:  GET api/auth
// @desc:   get the logged in user
// @access: private
// @role:   all
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route   POST api/auth
// @desc    authenticate user and get token
// @access  Public
// @role    all
router.post('/', [userValidation], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        // verify valid user
        if (!user) {
            return res.status(401).json({ errors: [{ msg: 'invalid credentials' }] });
        }

        // verify user password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ errors: [{ msg: 'invalid credentials' }] });
        }

        // return JWT token
        const payload = {
            user: {
                id: user.id,
                isMember: user.isMember,
                isAdmin: user.isAdmin,
            },
        };

        jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
