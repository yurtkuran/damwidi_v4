const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const request = require('request');
const config = require('config');

// database models
const User = require('../models/User');
const Profile = require('../models/Profile');

// authorization middleware
const auth = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// validation
const profileValidation = [check('status', 'please enter status').not().isEmpty(), check('skills', 'please enter skills').not().isEmpty()];
const experienceValidation = [
    check('title', 'please enter title').not().isEmpty(),
    check('company', 'please enter company').not().isEmpty(),
    check('from', 'from date is required').not().isEmpty(),
];
const educationValidation = [
    check('school', 'please enter school').not().isEmpty(),
    check('degree', 'please enter degree').not().isEmpty(),
    check('fieldofstudy', 'field of study is required').not().isEmpty(),
    check('from', 'from date is required').not().isEmpty(),
];

// @route:  GET api/profile/me
// @desc:   get profile of current user
// @access: private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ errors: [{ msg: 'no profile for this user' }] });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  POST api/profile
// @desc:   create or update user profile
// @access: private
router.post('/', [auth, profileValidation], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    const { company, location, website, bio, skills, status, githubusername, youtube, twitter, instagram, linkedin, facebook } = req.body;

    // build profile object
    const profileFields = {};
    profileFields.user = req.user.id;
    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;
    if (skills) profileFields.skills = skills.split(',').map((skill) => skill.trim());

    // build social object
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (twitter) profileFields.social.twitter = twitter;
    if (facebook) profileFields.social.facebook = facebook;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
            // update
            profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
        } else {
            // create
            profile = new Profile(profileFields);
            await profile.save();
        }

        return res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/profile
// @desc:   get all profiles
// @access: public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/profile/user/:user_id
// @desc:   get profile by user ID
// @access: public
router.get('/user/:user_id', async (req, res) => {
    try {
        const valid = mongoose.Types.ObjectId.isValid(req.params.user_id);
        if (!valid) return res.status(400).json({ msg: 'profile not found' });

        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'avatar']);
        if (!profile) return res.status(400).json({ msg: 'profile not found' });

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/profile
// @desc:   delete profile, user and posts
// @access: private
router.delete('/', auth, async (req, res) => {
    try {
        // @todo - remove user's posts
        // remove profile
        await Profile.findOneAndRemove({ user: req.user.id });

        // remove user
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'user deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  PUT api/profile/experience
// @desc:   add experience to profile
// @access: private
router.put('/experience', [auth, experienceValidation], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    const { title, company, location, from, to, current, description } = req.body;

    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description,
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/profile/experience/:exp_id
// @desc:   remove experience from profile
// @access: private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        // find profile
        const profile = await Profile.findOne({ user: req.user.id });

        // get index of experience to remove
        const removeIndex = profile.experience.map((item) => item.id).indexOf(req.params.exp_id);

        // remove experience
        profile.experience.splice(removeIndex, 1);

        // save profile
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  PUT api/profile/education
// @desc:   add education to profile
// @access: private
router.put('/education', [auth, educationValidation], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    const { school, degree, fieldofstudy, from, to, current, description } = req.body;

    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description,
    };

    try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);

        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/profile/education/:edu_id
// @desc:   remove education from profile
// @access: private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        // find profile
        const profile = await Profile.findOne({ user: req.user.id });

        // get index of education to remove
        const removeIndex = profile.education.map((item) => item.id).indexOf(req.params.edu_id);

        // remove education
        profile.education.splice(removeIndex, 1);

        // save profile
        await profile.save();

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/profile/github/:username
// @desc:   get user's repos from GitHub
// @access: public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientID')}&client_secret=${config.get(
                'githubSecret'
            )}`,
            method: 'GET',
            headers: { 'user-agent': 'node.js' },
        };

        request(options, (error, response, body) => {
            if (error) console.error(error);

            if (response.statusCode !== 200) {
                return res.status(404).json({ msg: 'github user profile not found' });
            }

            res.json(JSON.parse(body));
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
