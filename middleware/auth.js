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
        res.status(401).json({ msg: 'permission denied' });
    }
};

const ensureMember = (req, res, next) => {
    if (req.user.isMember) {
        return next();
    } else {
        res.status(401).json({ msg: 'permission denied' });
    }
};

module.exports = {
    auth,
    ensureAdmin,
    ensureMember,
};
