const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');  // Authentication routes for login, registration, and profile update
const recipeRoutes = require('./routes/recipes');  // Routes for saving, fetching, and deleting recipes
const mealPlanRoutes = require('./routes/mealPlans');  // Routes for meal plan management
const shoppingListRoutes = require('./routes/shoppingList');  // Routes for managing shopping lists

dotenv.config();  // Load environment variables from .env file
const app = express();

// Middleware
app.use(express.json());  // Middleware to parse JSON request bodies
app.use(cors());  // Enable Cross-Origin Resource Sharing (CORS) to allow frontend-backend communication

// Define Routes
app.use('/auth', authRoutes);  // Routes related to user authentication and profile management
app.use('/recipes', recipeRoutes);  // Routes for managing recipes (save, delete, search)
app.use('/meal-plans', mealPlanRoutes); // Routes for meal plan management
app.use('/shopping-list', shoppingListRoutes);  // Routes for updating and fetching shopping lists

// Route to Fetch Random Recipes for Home Page
app.get('/api/random-recipes', async (req, res) => {
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;  // Retrieve API key from environment variables
    try {
        // Send a request to Spoonacular API to fetch 5 random recipes
        const response = await axios.get('https://api.spoonacular.com/recipes/random', {
            params: {
                number: 5,  // Fetch 5 random recipes
                apiKey: SPOONACULAR_API_KEY,  // Pass the API key in request
            },
        });
        res.json(response.data.recipes);  // Send the fetched recipes back to the frontend
    } catch (error) {
        console.error('Error fetching random recipes:', error);  // Log any errors during the request
        res.status(500).json({ message: 'Server error while fetching random recipes' });  // Send error response to the client
    }
});

// Autocomplete Ingredient Search Route
app.get('/api/ingredients/autocomplete', async (req, res) => {
    const query = req.query.query;  // Extract the query parameter from the request
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;  // Retrieve API key from environment variables

    if (!query) {
        return res.status(400).json({ msg: 'Query is required' });  // Return error if no query is provided
    }

    try {
        // Send a request to Spoonacular API for ingredient autocomplete suggestions
        const response = await axios.get(`https://api.spoonacular.com/food/ingredients/autocomplete`, {
            params: {
                query,  // The search query (ingredient name)
                number: 5,  // Fetch up to 5 suggestions
                apiKey: SPOONACULAR_API_KEY,  // Pass the API key in the request
            }
        });
        res.json(response.data);  // Send the autocomplete results back to the frontend
    } catch (error) {
        console.error('Error fetching autocomplete results:', error.response?.data || error.message);  // Log any errors during the request
        res.status(500).json({ msg: 'Server error fetching autocomplete results' });  // Send error response to the client
    }
});

// Start the server and listen on the specified port (default: 3001)
const PORT = process.env.PORT || 3001;  // Use the PORT from environment variables, or default to 3001
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));  // Log the server URL
