const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');  // JWT verification middleware
const db = require('../config/db');  // Your database configuration
const router = express.Router();

// Save Recipe Route (Protected)
router.post('/save-recipe', verifyToken, async (req, res) => {
    const { spoonacular_id, title, image_url, ingredients } = req.body;  // Extracting from request body
    const userId = req.user.id;  // Retrieved from the decoded JWT token

    // Log the request body and userId for debugging
    console.log("Recipe Data Received:", { spoonacular_id, title, image_url, ingredients, userId });

    try {
        // Save the recipe in the database
        const result = await db.query(
            'INSERT INTO recipes (spoonacular_id, title, image_url, ingredients, user_id) VALUES ($1, $2, $3, $4, $5)',
            [spoonacular_id, title, image_url, ingredients, userId]
        );

        // Log the result for debugging
        console.log("Database Insertion Result:", result);

        res.status(201).json({ msg: 'Recipe saved successfully!' });
    } catch (error) {
        console.error("Error Saving Recipe:", error.message);
        res.status(500).send('Server Error');
    }
});

// Fetch Saved Recipes Route (Protected)
router.get('/my-recipes', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const recipes = await db.query('SELECT * FROM recipes WHERE user_id = $1', [userId]);
        res.json(recipes.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
