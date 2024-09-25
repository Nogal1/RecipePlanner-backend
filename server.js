const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');  // Authentication routes
const recipeRoutes = require('./routes/recipes');  // Import the recipe routes
const mealPlanRoutes = require('./routes/mealPlans');
const shoppingListRoutes = require('./routes/shoppingList');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());  // To parse incoming JSON requests
app.use(cors());  // Enable CORS for frontend-backend communication

// Routes
app.use('/auth', authRoutes);  // Auth routes
app.use('/recipes', recipeRoutes);  // Recipe-related routes
app.use('/meal-plans', mealPlanRoutes); // Meal Plans
app.use('/shopping-list', shoppingListRoutes);

// Random Recipes For HomePage
app.get('/api/random-recipes', async (req, res) => {
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;
    try {
        const response = await axios.get('https://api.spoonacular.com/recipes/random', {
            params: {
                number: 5,
                apiKey: SPOONACULAR_API_KEY,
            },
        });
        res.json(response.data.recipes);
    } catch (error) {
        console.error('Error fetching random recipes:', error);
        res.status(500).json({ message: 'Server error while fetching random recipes' });
    }
});

// Autocomplete Recipe Search Route
app.get('/api/ingredients/autocomplete', async (req, res) => {
    const query = req.query.query;
    const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

    if (!query) {
        return res.status(400).json({ msg: 'Query is required' });
    }

    try {
        const response = await axios.get(`https://api.spoonacular.com/food/ingredients/autocomplete`, {
            params: {
                query,
                number: 5,  // Number of results to fetch
                apiKey: SPOONACULAR_API_KEY,
            }
        });
        res.json(response.data);  // Send autocomplete results back to frontend
    } catch (error) {
        console.error('Error fetching autocomplete results:', error.response?.data || error.message);
        res.status(500).json({ msg: 'Server error fetching autocomplete results' });
    }
});

// Server running on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
