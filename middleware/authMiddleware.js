const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.header('x-auth-token');

    // Check if token is provided
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;  // Attach user data to the request
        next();
    } catch (error) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = { verifyToken };
