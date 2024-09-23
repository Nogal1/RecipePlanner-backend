const express = require('express');
const axios = require('axios');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');  // Authentication routes
const recipeRoutes = require('./routes/recipes');  // Import the recipe routes

dotenv.config();
const app = express();

// Middleware
app.use(express.json());  // To parse incoming JSON requests
app.use(cors());  // Enable CORS for frontend-backend communication

// Routes
app.use('/auth', authRoutes);  // Auth routes
app.use('/recipes', recipeRoutes);  // Recipe-related routes

// Recipe Search Route
app.get('/search/:ingredients', async (req, res) => {
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
app.get('/recipe/:id', async (req, res) => {
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

// Server running on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
