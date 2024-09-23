const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();  // Call next to proceed to the route handler
    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

module.exports = { verifyToken };
