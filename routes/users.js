const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// database models
const User = require('../models/User');

// authorization middleware
const { auth, ensureAdmin } = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// validation - new user
const newUserValidation = [
    check('firstName', 'Please add first name').not().isEmpty(),
    check('lastName', 'Please add last name').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 8 characters').isLength({ min: 6 }),
    check('email').custom((email, { req }) => {
        // check if email exists in database
        return User.findOne({ email }).then((newuser) => {
            if (newuser) {
                // email exists
                return Promise.reject('E-mail already in use');
            }
        });
    }),
];

// validation - existing user
const existingUserValidation = [
    check('firstName', 'This is a required field').not().isEmpty(),
    check('lastName', 'This is a required field').not().isEmpty(),
    check('email', 'Invalid e-mail address').isEmail().withMessage(),
    check('email').custom((email, { req }) => {
        // check if email exists in database
        return User.findOne({ email }).then((user) => {
            console.log(user);
            if (user) {
                // email exists
                if (user._id != req.body._id) {
                    // check if different or same user
                    return Promise.reject('E-mail already in use');
                } else {
                    return true;
                }
            }
        });
    }),
];

// @route:  GET api/users
// @desc:   get all members
// @access: private
// @role:   admin
router.get('/', auth, ensureAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/users
// @desc:   register user (add user)
// @access: public
// @role:   all
router.post('/', newUserValidation, async (req, res) => {
    // process validation errors, if any
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }
    const { firstName, lastName, email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            // user exists
            return res.status(400).json({ errors: [{ msg: 'user already exists' }] });
        }

        // new user
        user = new User({
            firstName,
            lastName,
            email,
            password,
        });

        // encrypt password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // save to database
        await user.save();

        // return JWT token
        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(payload, process.env.SECRET, { expiresIn: '1d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/users/update
// @desc:   update user - self
// @access: private
// @role:   all
router.post('/update', auth, existingUserValidation, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    const { firstName, lastName, email } = req.body;

    // build user object
    const userFields = {
        firstName,
        lastName,
        email,
    };

    try {
        // update
        user = await User.findOneAndUpdate({ _id: req.user.id }, { $set: userFields }, { new: true });

        return res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/users/update
// @desc:   update user - admin
// @access: private
// @role:   all
router.post('/update/:userID', [auth, ensureAdmin], existingUserValidation, async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    const { firstName, lastName, email, isVerified, isMember, isAdmin } = req.body;

    // build user object
    const userFields = {
        firstName,
        lastName,
        email,
        isVerified,
        isMember,
        isAdmin,
    };

    try {
        // update
        user = await User.findOneAndUpdate({ _id: req.params.userID }, { $set: userFields }, { new: true });
        return res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/users
// @desc:   delete user - self
// @access: private
// @role:   all
router.delete('/', auth, async (req, res) => {
    try {
        // remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'user deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/users/:userID
// @desc:   delete user - admin
// @access: private
// @role:   admin
router.delete('/:userID', auth, ensureAdmin, async (req, res) => {
    try {
        // remove user
        await User.findOneAndRemove({ _id: req.params.userID });

        res.json({ msg: 'user deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
