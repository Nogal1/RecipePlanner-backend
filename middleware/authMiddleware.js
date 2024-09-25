const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token for protected routes.
 * 
 * This middleware checks if a valid token is provided in the request header,
 * verifies it, and attaches the decoded user object to the request. If no token 
 * is provided, or if the token is invalid, an error is returned with status 401.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function to call
 */
const verifyToken = (req, res, next) => {
    // Get token from the 'x-auth-token' header
    const token = req.header('x-auth-token');

    // If no token is provided, return a 401 Unauthorized response
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify the token using the secret key from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach the decoded user object to the request for access in the next middleware or route handler
        req.user = decoded.user;

        // Call the next middleware or route handler
        next();
    } catch (error) {
        // If token is not valid, return a 401 Unauthorized response
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = { verifyToken };
