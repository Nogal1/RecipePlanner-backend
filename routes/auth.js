const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');  // Ensure correct path

/**
 * User Registration Route
 * 
 * Registers a new user with email, username, and password. It:
 *  - Validates email format and password length using `express-validator`.
 *  - Checks if the user already exists in the database.
 *  - Hashes the password using bcrypt before saving the user in the DB.
 *  - Generates a JWT token to authenticate the user after registration.
 */
router.post('/register', [
    check('email', 'Please include a valid email').isEmail(),  // Validate email
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })  // Validate password length
], async (req, res) => {
    const errors = validationResult(req);  // Handle validation errors
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });  // Return validation errors
    }

    const { email, username, password } = req.body;

    try {
        // Check if the user already exists in the database
        let user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length > 0) {
            return res.status(400).json({ msg: 'User already exists' });  // Return error if user exists
        }

        // Generate salt and hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user into the database
        await db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', 
            [username, email, hashedPassword]);

        // Generate JWT token
        const payload = { user: { email } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ token });  // Respond with token
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * User Login Route
 * 
 * Logs in a user by checking email and password. It:
 *  - Validates the provided email and password.
 *  - Checks if the user exists in the database.
 *  - Verifies the password with bcrypt.
 *  - Generates a JWT token for authentication on successful login.
 */
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),  // Validate email
    check('password', 'Password is required').exists()  // Ensure password is provided
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check if the user exists in the database
        let user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Invalid Credentials' });  // Return error if user doesn't exist
        }

        // Compare the entered password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });  // Return error if passwords don't match
        }

        // Generate JWT token with user ID and email
        const payload = { user: { id: user.rows[0].id, email: user.rows[0].email } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ token });  // Respond with token
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

/**
 * User Profile Update Route
 * 
 * Allows users to update their email or password. It:
 *  - Uses the `verifyToken` middleware to ensure the user is authenticated.
 *  - Allows updating either the email, password, or both.
 *  - Verifies the current password before allowing a password change.
 *  - Hashes the new password before storing it.
 */
router.post('/profile', verifyToken, async (req, res) => {
    const { email, password, newPassword } = req.body;
    const userId = req.user.id;  // Get user ID from the token

    try {
        // Fetch user from the database
        let user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // If updating password
        if (password) {
            const isMatch = await bcrypt.compare(password, user.rows[0].password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid current password' });  // Return error if current password is incorrect
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
        }

        // If updating email
        if (email) {
            await db.query('UPDATE users SET email = $1 WHERE id = $2', [email, userId]);
        }

        res.json({ msg: 'Profile updated successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
