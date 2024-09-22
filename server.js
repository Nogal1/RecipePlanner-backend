const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3001;

// Replace with your actual Spoonacular API Key
const SPOONACULAR_API_KEY = '60acdff1b2a24f43ae897699f8c2c472';
const BASE_URL = 'https://api.spoonacular.com/recipes';

// Route for searching recipes by ingredients
app.get('/search/:ingredients', async (req, res) => {
    const ingredients = req.params.ingredients;
    
    try {
        const response = await axios.get(`${BASE_URL}/findByIngredients`, {
            params: {
                ingredients: ingredients,
                number: 10, // Limit results
                apiKey: SPOONACULAR_API_KEY
            }
        });
        res.json(response.data);
    } catch (error) {
        res.status(500).send('Error fetching recipes');
    }
});

// Test Route to verify server is running
app.get('/', (req, res) => {
    res.send('RecipePlanner Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
