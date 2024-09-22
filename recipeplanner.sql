CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    spoonacular_id INT,
    title VARCHAR(255),
    image_url VARCHAR(255),
    ingredients TEXT,
    user_id INT REFERENCES users(id)
);
