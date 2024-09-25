-- Table for storing user information
CREATE TABLE users (
    id SERIAL PRIMARY KEY,                          -- Unique user ID
    username VARCHAR(255) NOT NULL,                 -- User's name (required)
    email VARCHAR(255) UNIQUE NOT NULL,             -- User's unique email address (required)
    password VARCHAR(255) NOT NULL,                 -- Hashed password (required)
    created_at TIMESTAMP DEFAULT NOW(),             -- Timestamp when the user account was created
    updated_at TIMESTAMP DEFAULT NOW()              -- Timestamp for when the user account was last updated
);

-- Table for storing user-specific recipes
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,                          -- Unique recipe ID
    spoonacular_id INT,                             -- Spoonacular recipe ID for external reference
    title VARCHAR(255),                             -- Recipe title
    image_url VARCHAR(255),                         -- Image URL for the recipe
    ingredients TEXT,                               -- Recipe ingredients stored as text
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- Reference to the user who saved the recipe, deletes on user deletion
    created_at TIMESTAMP DEFAULT NOW(),             -- Timestamp for when the recipe was saved
    updated_at TIMESTAMP DEFAULT NOW()              -- Timestamp for when the recipe was last updated
);

-- Table for storing meal plans for users
CREATE TABLE meal_plans (
    id SERIAL PRIMARY KEY,                          -- Unique meal plan ID
    spoonacular_id INT,                             -- Spoonacular recipe ID (for reference)
    user_id INT REFERENCES users(id),               -- Reference to the user who created the meal plan
    recipe_id INT REFERENCES recipes(id),           -- Reference to the recipe used in the meal plan
    day_of_week VARCHAR(20) NOT NULL,               -- Day of the week (e.g., "Monday", "Tuesday")
    meal_type VARCHAR(20) NOT NULL,                 -- Meal type (e.g., "Breakfast", "Lunch", "Dinner")
    created_at TIMESTAMP DEFAULT NOW()              -- Timestamp for when the meal was added to the plan
);

-- Table for storing shopping list items for users
CREATE TABLE shopping_lists (
    id SERIAL PRIMARY KEY,                          -- Unique shopping list item ID
    user_id INT REFERENCES users(id) ON DELETE CASCADE, -- Reference to the user, deletes on user deletion
    ingredient VARCHAR(255) NOT NULL,               -- Ingredient for the shopping list
    added_at TIMESTAMP DEFAULT NOW()                -- Timestamp for when the ingredient was added
);

-- Trigger function to automatically update the `updated_at` column for the users table
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();                          -- Set the updated_at column to the current time
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger function to automatically update the `updated_at` column for the recipes table
CREATE OR REPLACE FUNCTION update_recipes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();                          -- Set the updated_at column to the current time
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger for updating the `updated_at` field in the users table before every update
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at_column();

-- Trigger for updating the `updated_at` field in the recipes table before every update
CREATE TRIGGER trigger_update_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_recipes_updated_at_column();
