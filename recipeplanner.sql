CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    spoonacular_id INT,
    title VARCHAR(255),
    image_url VARCHAR(255),
    ingredients TEXT,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE meal_plans (
    id SERIAL PRIMARY KEY,
    spoonacular_id INT,
    user_id INT REFERENCES users(id),
    recipe_id INT REFERENCES recipes(id),
    day_of_week VARCHAR(20) NOT NULL,  -- Store the day (e.g., "Monday", "Tuesday")
    meal_type VARCHAR(20) NOT NULL,    -- Optional: Store meal type (e.g., "breakfast", "lunch", "dinner")
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE shopping_lists (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,  -- Associate the shopping list with a user
    ingredient VARCHAR(255) NOT NULL,                    -- Store individual ingredients
    added_at TIMESTAMP DEFAULT NOW()                     -- Timestamp for when the ingredient was added
);

-- Create trigger functions to automatically update the updated_at field

-- Trigger function for the users table
CREATE OR REPLACE FUNCTION update_users_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger function for the recipes table
CREATE OR REPLACE FUNCTION update_recipes_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Create the trigger for the users table
CREATE TRIGGER trigger_update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_users_updated_at_column();

-- Create the trigger for the recipes table
CREATE TRIGGER trigger_update_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_recipes_updated_at_column();

