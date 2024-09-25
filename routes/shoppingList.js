const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');  // JWT verification middleware to ensure only authenticated users can access the routes
const db = require('../config/db');  // Database configuration for querying Postgres
const router = express.Router();

/**
 * Update Shopping List Route (Protected)
 * 
 * POST /shopping-list
 * 
 * Updates the authenticated user's shopping list. 
 * It:
 *  - Requires token authentication (via `verifyToken` middleware).
 *  - Replaces the user's existing shopping list with the new list of ingredients.
 *  - Expects an array of `ingredients` in the request body.
 */
router.post('/', verifyToken, async (req, res) => {
    const { ingredients } = req.body;  // Extract the ingredients array from the request body
    const userId = req.user.id;  // Extract user ID from the verified token

    // Validate that ingredients are provided and that it's an array
    if (!ingredients || !Array.isArray(ingredients)) {
        return res.status(400).json({ message: 'Invalid ingredients' });
    }

    try {
        // Clear the user's current shopping list by deleting all entries
        await db.query('DELETE FROM shopping_lists WHERE user_id = $1', [userId]);

        // Insert each new ingredient into the shopping list
        for (const ingredient of ingredients) {
            await db.query('INSERT INTO shopping_lists (user_id, ingredient) VALUES ($1, $2)', [userId, ingredient]);
        }

        res.json({ message: 'Shopping list updated successfully' });
    } catch (error) {
        console.error('Error updating shopping list:', error);
        res.status(500).json({ message: 'Server error while updating shopping list' });
    }
});

/**
 * Fetch Shopping List Route (Protected)
 * 
 * GET /shopping-list
 * 
 * Retrieves the authenticated user's current shopping list. 
 * It:
 *  - Requires token authentication (via `verifyToken` middleware).
 *  - Returns the user's list of ingredients stored in the shopping list.
 */
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;  // Extract user ID from the verified token

    try {
        // Query the database to fetch the user's shopping list ingredients
        const result = await db.query('SELECT ingredient FROM shopping_lists WHERE user_id = $1', [userId]);

        // Map the result rows to extract only the ingredients
        const shoppingList = result.rows.map(row => row.ingredient);

        // Send the shopping list back to the client
        res.json(shoppingList);
    } catch (error) {
        console.error('Error fetching shopping list:', error);
        res.status(500).json({ message: 'Server error while fetching shopping list' });
    }
});

module.exports = router;
