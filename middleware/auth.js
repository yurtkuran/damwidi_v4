const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // get token
    const token = req.header('x-auth-token');

    // check is token does not exist
    if (!token) {
        return res.status(401).json({ msg: 'no token, authorization denied' });
    }

    // verify token
    try {
        const decoded = jwt.verify(token, process.env.SECRET);
        req.user = decoded.user;
        next();
    } catch (error) {
        res.status(401).json({ msg: 'invalid token' });
    }
};

const ensureAdmin = (req, res, next) => {
    if (req.user.isAdmin) {
        return next();
    } else {
        res.status(401).json({ msg: 'permission denied - not admin' });
    }
};

const ensureMember = (req, res, next) => {
    if (req.user.isMember) {
        return next();
    } else {
        res.status(401).json({ msg: 'permission denied - not member' });
    }
};

const ensureVerified = (req, res, next) => {
    if (req.user.isVerified) {
        return next();
    } else {
        res.status(401).json({ msg: 'permission denied - not verified' });
    }
};

module.exports = {
    auth,
    ensureAdmin,
    ensureMember,
    ensureVerified,
};
