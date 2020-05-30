const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// database models
const User = require('../models/User');
const Profile = require('../models/Profile');
const Post = require('../models/Post');

// authorization middleware
const auth = require('../middleware/auth');

// express validator middleware
const { check, validationResult } = require('express-validator');

// validation
const postValidation = [check('text', 'text is required').not().isEmpty()];
const postCommentValidation = [check('text', 'text is required').not().isEmpty()];

// @route:  POST api/posts
// @desc:   create a post
// @access: private
router.post('/', [auth, postValidation], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    try {
        const user = await User.findById(req.user.id).select('-password');

        const newPost = new Post({
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        });

        const post = await newPost.save();
        return res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/posts
// @desc:   get all posts
// @access: private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        if (!posts) {
            return res.status(404).json({ errors: [{ msg: 'no posts found' }] });
        }
        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  GET api/posts/:ID
// @desc:   get post by post ID
// @access: private
router.get('/:id', auth, async (req, res) => {
    try {
        const valid = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!valid) return res.status(404).json({ msg: 'post not found' });

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ errors: [{ msg: 'post not found' }] });
        }
        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/posts/:ID
// @desc:   delete post by post ID
// @access: private
router.delete('/:id', auth, async (req, res) => {
    try {
        const valid = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!valid) return res.status(404).json({ msg: 'post not found' });

        // find post
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ errors: [{ msg: 'post not found' }] });
        }

        // verify post belongs to current user
        if (post.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'user not authorized' });
        }

        await post.remove();
        res.json({ msg: 'post removed' });

        res.json(post);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  PUT api/posts/like/:ID
// @desc:   like a post by post ID
// @access: private
router.put('/like/:id', auth, async (req, res) => {
    try {
        const valid = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!valid) return res.status(404).json({ msg: 'post not found' });

        // find post
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ errors: [{ msg: 'post not found' }] });
        }

        // check if post is already liked by user
        if (post.likes.filter((like) => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'post already liked' });
        }

        // save to top of like array
        post.likes.unshift({ user: req.user.id });

        // save to database
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  PUT api/posts/unlike/:ID
// @desc:   remove like from post by post ID
// @access: private
router.put('/unlike/:id', auth, async (req, res) => {
    try {
        const valid = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!valid) return res.status(404).json({ msg: 'post not found' });

        // find post
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ errors: [{ msg: 'post not found' }] });
        }

        // check if post is already liked by user
        if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
            return res.status(400).json({ msg: 'post is not yet liked' });
        }

        // get index of like to remove
        const removeIndex = post.likes.map((item) => item.id).indexOf(req.params.id);

        // remove like
        post.likes.splice(removeIndex, 1);

        // save to database
        await post.save();
        res.json(post.likes);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  PUT api/posts/comment/:id
// @desc:   add a comment to a post by post id
// @access: private
router.put('/comment/:id', [auth, postCommentValidation], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // validation fails
        return res.status(400).json({ errors: errors.array() });
    }

    // validation passes
    try {
        const user = await User.findById(req.user.id).select('-password');
        const post = await Post.findById(req.params.id);

        const valid = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!valid) return res.status(404).json({ msg: 'post not found' });

        const newComment = {
            text: req.body.text,
            name: user.name,
            avatar: user.avatar,
            user: req.user.id,
        };

        post.comments.unshift(newComment);

        // save to database
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

// @route:  DELETE api/posts/comment/:id/:comment_id
// @desc:   delete a comment to a post by post id
// @access: private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
    try {
        // find post
        const valid = mongoose.Types.ObjectId.isValid(req.params.id);
        if (!valid) return res.status(404).json({ msg: 'post not found' });
        const post = await Post.findById(req.params.id);

        // find comment
        const validComment = mongoose.Types.ObjectId.isValid(req.params.comment_id);
        if (!validComment) return res.status(404).json({ msg: 'comment not found' });
        const comment = post.comments.find((comment) => comment.id.toString() === req.params.comment_id);

        // verify comment exists
        if (!comment) return res.status(404).json({ msg: 'comment not found' });

        // check if comment belongs to user
        if (comment.user.toString() !== req.user.id) return res.status(401).json({ msg: 'comment not from user' });

        // get index of comment to remove
        const removeIndex = post.comments.map((comment) => comment.id).indexOf(req.params.comment_id);

        // remove comment
        post.comments.splice(removeIndex, 1);

        // save to database
        await post.save();
        res.json(post.comments);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('server error');
    }
});

module.exports = router;
