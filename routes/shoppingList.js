const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');  // JWT verification middleware
const db = require('../config/db');  // Your database configuration
const router = express.Router();

// POST route to update shopping list
router.post('/', verifyToken, async (req, res) => {
    const { ingredients } = req.body;
    const userId = req.user.id;

    try {
        await db.query('DELETE FROM shopping_lists WHERE user_id = $1', [userId]);  // Clear old list

        for (const ingredient of ingredients) {
            await db.query('INSERT INTO shopping_lists (user_id, ingredient) VALUES ($1, $2)', [userId, ingredient]);
        }

        res.json({ message: 'Shopping list updated' });
    } catch (error) {
        console.error('Error updating shopping list:', error);
        res.status(500).json({ message: 'Server error while updating shopping list' });
    }
});

// GET route to fetch shopping list
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await db.query('SELECT ingredient FROM shopping_lists WHERE user_id = $1', [userId]);
        const shoppingList = result.rows.map(row => row.ingredient);
        res.json(shoppingList);
    } catch (error) {
        console.error('Error fetching shopping list:', error);
        res.status(500).json({ message: 'Server error while fetching shopping list' });
    }
});

// Export the router correctly
module.exports = router;
