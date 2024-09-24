const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');  // JWT verification middleware
const db = require('../config/db');
const router = express.Router();

// POST route to update the current user's shopping list
router.post('/', verifyToken, async (req, res) => {
    const { ingredients } = req.body;
    const userId = req.user.id;  // Extract user ID from token

    if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: 'Invalid ingredients' });
    }

    try {
        // Clear the user's current shopping list
        await db.query('DELETE FROM shopping_lists WHERE user_id = $1', [userId]);

        // Insert the new ingredients into the user's shopping list
        for (const ingredient of ingredients) {
            await db.query('INSERT INTO shopping_lists (user_id, ingredient) VALUES ($1, $2)', [userId, ingredient]);
        }

        res.json({ message: 'Shopping list updated successfully' });
    } catch (error) {
        console.error('Error updating shopping list:', error);
        res.status(500).json({ message: 'Server error while updating shopping list' });
    }
});

// GET route to fetch the current user's shopping list
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;  // Extract user ID from token

    try {
        const result = await db.query('SELECT ingredient FROM shopping_lists WHERE user_id = $1', [userId]);
        const shoppingList = result.rows.map(row => row.ingredient);
        res.json(shoppingList);  // Send the shopping list back to the frontend
    } catch (error) {
        console.error('Error fetching shopping list:', error);
        res.status(500).json({ message: 'Server error while fetching shopping list' });
    }
});

module.exports = router;
