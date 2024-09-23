const { Pool } = require('pg');  // Import the pg Pool

// Create a new pool with the correct database configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME || "plood",
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,  // Default PostgreSQL port
});

// Export the pool for querying the database
module.exports = {
    query: (text, params) => pool.query(text, params),
};
