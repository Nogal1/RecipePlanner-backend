const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth'); // Ensure the path to auth is correct

dotenv.config();
const app = express();

// Middleware
app.use(express.json());  // To parse incoming JSON requests
app.use(cors());          // Enable CORS for frontend-backend communication

// Routes
app.use('/auth', authRoutes);  // All routes from auth.js will be under /auth

// Server running on port 3001
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
