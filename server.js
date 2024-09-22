const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { check, validationResult } = require('express-validator'); // Import express-validator

require('dotenv').config(); // Load environment variables from .env
const app = express();

// Middleware
app.use(express.json()); // Parse incoming JSON requests
app.use(cors()); // Allow cross-origin requests (necessary for frontend-backend communication)

// Port configuration
const PORT = process.env.PORT || 3001;

// Spoonacular API key from environment variables
const SPOONACULAR_API_KEY = process.env.SPOONACULAR_API_KEY;

// ------------------------------
// Recipe Search Route (Spoonacular API Integration)
// ------------------------------
app.get('/search/:ingredients', [
    check('ingredients', 'Ingredients must be provided').notEmpty() // Validate that ingredients are provided
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const ingredients = req.params.ingredients;

    try {
        // Fetch recipes by ingredients from Spoonacular API
        const response = await axios.get(
            `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=10&apiKey=${SPOONACULAR_API_KEY}`
        );
        
        // Send back the recipes data
        res.json(response.data);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server Error');
    }
});

// ------------------------------
// Basic route to check server is running
// ------------------------------
app.get('/', (req, res) => {
    res.send('RecipePlanner backend is running');
});

// ------------------------------
// Start the server
// ------------------------------
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
