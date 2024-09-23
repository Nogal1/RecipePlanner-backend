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

// Server running on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
