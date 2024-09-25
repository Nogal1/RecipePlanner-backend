const express = require('express');
const axios = require('axios');
const { verifyToken } = require('../middleware/authMiddleware');  // JWT verification middleware for protected routes
const db = require('../config/db');  // Database configuration for querying Postgres
const router = express.Router();

/**
 * Save Recipe Route (Protected)
 * 
 * POST /recipes/save-recipe
 * 
 * Saves a recipe to the authenticated user's saved recipes. 
 * It:
 *  - Requires token authentication (via `verifyToken` middleware).
 *  - Expects `spoonacular_id`, `title`, `image_url`, and `ingredients` in the request body.
 *  - Saves the recipe data to the `recipes` table, linking it with the user.
 */
router.post('/save-recipe', verifyToken, async (req, res) => {
    const { spoonacular_id, title, image_url, ingredients } = req.body;  // Extracting recipe details from the request body
    const userId = req.user.id;  // Retrieved from the decoded JWT token

    // Log the request body and userId for debugging purposes
    console.log("Recipe Data Received:", { spoonacular_id, title, image_url, ingredients, userId });

    try {
        // Insert the recipe into the database
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

/**
 * Delete Saved Recipe Route (Protected)
 * 
 * DELETE /recipes/my-recipes/:id
 * 
 * Deletes a recipe from the user's saved recipes. 
 * It:
 *  - Requires token authentication (via `verifyToken` middleware).
 *  - Deletes a recipe only if it belongs to the authenticated user.
 *  - Expects the `id` of the recipe to delete in the URL parameter.
 */
router.delete('/my-recipes/:id', verifyToken, async (req, res) => {
    const userId = req.user.id;  // User ID retrieved from the JWT token
    const recipeId = req.params.id;  // Recipe ID from the URL parameter

    try {
        // Delete the recipe that belongs to the user
        const result = await db.query(
            'DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING *', 
            [recipeId, userId]
        );

        // If no rows were deleted, the recipe does not exist or the user is not authorized
        if (result.rowCount === 0) {
            return res.status(404).json({ msg: 'Recipe not found or you are not authorized to delete it' });
        }

        res.json({ msg: 'Recipe deleted successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * Fetch Saved Recipes Route (Protected)
 * 
 * GET /recipes/my-recipes
 * 
 * Retrieves all the recipes saved by the authenticated user. 
 * It:
 *  - Requires token authentication (via `verifyToken` middleware).
 *  - Returns all the saved recipes associated with the authenticated user.
 */
router.get('/my-recipes', verifyToken, async (req, res) => {
    const userId = req.user.id;  // User ID retrieved from the JWT token

    try {
        // Query to fetch the saved recipes for the authenticated user
        const recipes = await db.query('SELECT * FROM recipes WHERE user_id = $1', [userId]);
        res.json(recipes.rows);  // Return the saved recipes
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

/**
 * Recipe Search Route (Open)
 * 
 * GET /recipes/search/:ingredients
 * 
 * Searches for recipes based on the provided ingredients.
 * It:
 *  - Does not require authentication (open to all users).
 *  - Uses the Spoonacular API to search for recipes with the given ingredients.
 *  - Supports pagination via the `page` query parameter.
 *  - Returns a list of recipes from the Spoonacular API.
 */
router.get('/search/:ingredients', async (req, res) => {
    const ingredients = req.params.ingredients;  // Get ingredients from the URL
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;  // API key from environment variable
    const page = req.query.page || 1;  // Pagination, defaults to page 1 if not provided
    const recipesPerPage = 10;  // Number of recipes per page
    const offset = (page - 1) * recipesPerPage;  // Calculate the offset for pagination

    try {
        // Call the Spoonacular API to fetch recipes based on ingredients
        const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients`, {
            params: {
                ingredients: ingredients,
                number: recipesPerPage,
                offset: offset,
                apiKey: SPOONACULAR_API_KEY
            }
        });
        res.json(response.data);  // Return the list of recipes from the Spoonacular API
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error while fetching recipes' });
    }
});

/**
 * Recipe Details Route (Open)
 * 
 * GET /recipes/:id
 * 
 * Fetches the details of a specific recipe by its Spoonacular ID.
 * It:
 *  - Does not require authentication (open to all users).
 *  - Uses the Spoonacular API to fetch detailed recipe information.
 *  - Returns the detailed recipe data from the Spoonacular API.
 */
router.get('/:id', async (req, res) => {
    const recipeId = req.params.id;  // Recipe ID from the URL parameter
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;  // API key from environment variable

    try {
        // Call the Spoonacular API to fetch recipe details
        const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information`, {
            params: { apiKey: SPOONACULAR_API_KEY }
        });
        res.json(response.data);  // Return the detailed recipe information
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Server error while fetching recipe details' });
    }
});

module.exports = router;
