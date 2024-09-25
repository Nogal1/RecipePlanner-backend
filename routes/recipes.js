const express = require('express');
const axios = require('axios');
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

// Delete Saved Recipe Route (Protected)
router.delete('/my-recipes/:id', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const recipeId = req.params.id;

    try {
        // Delete the recipe that belongs to the user
        const result = await db.query(
            'DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING *', 
            [recipeId, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Recipe not found or you are not authorized to delete it' });
        }

        res.json({ msg: 'Recipe deleted successfully' });
    } catch (error) {
        console.error(error.message);
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

// Recipe Search Route
router.get('/search/:ingredients', async (req, res) => {
    const ingredients = req.params.ingredients;
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
    const page = req.query.page || 1;
    const recipesPerPage = 10;  // Number of recipes per page
    const offset = (page - 1) * recipesPerPage;

    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients`, {
            params: {
                ingredients: ingredients,
                number: recipesPerPage,
                offset: offset,
                apiKey: SPOONACULAR_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error while fetching recipes' });
    }
});

// Recipe Details Route
router.get('/:id', async (req, res) => {
    const recipeId = req.params.id;
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

    try {
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
            params: { apiKey: SPOONACULAR_API_KEY }
        });
        res.json(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error while fetching recipe details' });
    }
});




module.exports = router;
