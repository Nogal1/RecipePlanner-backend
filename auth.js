const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../config/db'); // Database connection
require('dotenv').config();

// JWT Secret Key from .env
const JWT_SECRET = process.env.JWT_SECRET;

// ------------------------------
// User Registration
// ------------------------------
router.post(
  '/register',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
      // Check if user already exists
      let user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length > 0) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert user into database
      await db.query(
        'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)',
        [username, email, hashedPassword]
      );

      // Generate and return JWT token
      const payload = { user: { email } };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      res.status(201).json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ------------------------------
// User Login
// ------------------------------
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Find user by email
      let user = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      if (user.rows.length === 0) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.rows[0].password);
      if (!isMatch) {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }

      // Generate and return JWT token
      const payload = { user: { email } };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

      res.status(200).json({ token });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ------------------------------
// Middleware to Protect Routes
// ------------------------------
const authMiddleware = (req, res, next) => {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// ------------------------------
// Get User Profile
// ------------------------------
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const email = req.user.email;
    const user = await db.query('SELECT username, email FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.status(200).json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ------------------------------
// Update User Profile
// ------------------------------
router.put(
  '/profile',
  authMiddleware,
  [
    check('username', 'Username is required').optional().isString(),
    check('password', 'Please enter a password with 6 or more characters').optional().isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const email = req.user.email;

    try {
      let updateFields = [];
      let updateValues = [];
      let queryIndex = 1;

      if (username) {
        updateFields.push(`username = $${queryIndex}`);
        updateValues.push(username);
        queryIndex++;
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        updateFields.push(`password = $${queryIndex}`);
        updateValues.push(hashedPassword);
        queryIndex++;
      }

      updateValues.push(email);
      const query = `UPDATE users SET ${updateFields.join(', ')} WHERE email = $${queryIndex}`;

      await db.query(query, updateValues);

      res.status(200).json({ msg: 'Profile updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// ------------------------------
// Delete User Account
// ------------------------------
router.delete('/profile', authMiddleware, async (req, res) => {
  const email = req.user.email;

  try {
    // Delete associated recipes first
    await db.query('DELETE FROM recipes WHERE user_id = (SELECT id FROM users WHERE email = $1)', [email]);

    // Delete the user account
    await db.query('DELETE FROM users WHERE email = $1', [email]);

    res.status(200).json({ msg: 'User account deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ------------------------------
// Save Recipe to User Profile
// ------------------------------
router.post('/save-recipe', authMiddleware, async (req, res) => {
  const { spoonacular_id, title, image_url, ingredients } = req.body;
  const email = req.user.email;

  try {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const userId = user.rows[0].id;

    await db.query(
      'INSERT INTO recipes (spoonacular_id, title, image_url, ingredients, user_id) VALUES ($1, $2, $3, $4, $5)',
      [spoonacular_id, title, image_url, ingredients, userId]
    );

    res.status(201).json({ msg: 'Recipe saved successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ------------------------------
// Get Saved Recipes
// ------------------------------
router.get('/my-recipes', authMiddleware, async (req, res) => {
  const email = req.user.email;

  try {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const userId = user.rows[0].id;

    const recipes = await db.query('SELECT * FROM recipes WHERE user_id = $1', [userId]);

    res.status(200).json(recipes.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// ------------------------------
// Delete Saved Recipe
// ------------------------------
router.delete('/delete-recipe/:id', authMiddleware, async (req, res) => {
  const recipeId = req.params.id;
  const email = req.user.email;

  try {
    const user = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    if (user.rows.length === 0) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const userId = user.rows[0].id;

    await db.query('DELETE FROM recipes WHERE id = $1 AND user_id = $2', [recipeId, userId]);

    res.status(200).json({ msg: 'Recipe deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = { router, authMiddleware };
