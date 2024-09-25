const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');  // Ensure user is authenticated
const db = require('../config/db');

/**
 * Add a Meal to the Meal Plan
 * 
 * POST /mealPlans/add
 * 
 * Adds a meal (recipe) to the user's meal plan. It:
 *  - Requires token authentication (using `verifyToken` middleware).
 *  - Expects `recipe_id`, `day_of_week`, and `meal_type` in the request body.
 *  - Stores the meal in the `meal_plans` table with the associated user ID.
 */
router.post('/add', verifyToken, async (req, res) => {
    const { recipe_id, day_of_week, meal_type } = req.body;
    const user_id = req.user.id;  // Get the user ID from the verified token

    try {
        // Insert the meal into the meal_plans table
        await db.query(
            'INSERT INTO meal_plans (user_id, recipe_id, day_of_week, meal_type) VALUES ($1, $2, $3, $4)',
            [user_id, recipe_id, day_of_week, meal_type]
        );
        res.status(201).json({ msg: 'Meal added to meal plan successfully!' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

/**
 * Fetch User's Meal Plan
 * 
 * GET /mealPlans/
 * 
 * Retrieves the user's complete meal plan. It:
 *  - Requires token authentication (using `verifyToken` middleware).
 *  - Joins the `meal_plans` table with the `recipes` table to include recipe details (title, image_url).
 *  - Returns the meal plan, ordered by the day of the week.
 */
router.get('/', verifyToken, async (req, res) => {
    const user_id = req.user.id;  // Get the user ID from the verified token

    try {
        // Query to get the meal plan with the related recipe details
        const result = await db.query(
            'SELECT meal_plans.*, recipes.title, recipes.image_url FROM meal_plans ' +
            'JOIN recipes ON meal_plans.recipe_id = recipes.id WHERE meal_plans.user_id = $1 ' +
            'ORDER BY meal_plans.day_of_week',
            [user_id]
        );
        res.json(result.rows);  // Return the meal plan data
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

/**
 * Delete a Meal from the Meal Plan
 * 
 * DELETE /mealPlans/delete/:id
 * 
 * Deletes a specific meal from the user's meal plan. It:
 *  - Requires token authentication (using `verifyToken` middleware).
 *  - Expects the meal plan ID (`plan_id`) as a URL parameter.
 *  - Deletes the meal entry only if it belongs to the authenticated user.
 */
router.delete('/delete/:id', verifyToken, async (req, res) => {
    const plan_id = req.params.id;  // Get the meal plan ID from the URL parameter
    const user_id = req.user.id;  // Get the user ID from the verified token

    try {
        // Delete the meal plan entry if it belongs to the authenticated user
        await db.query('DELETE FROM meal_plans WHERE id = $1 AND user_id = $2', [plan_id, user_id]);
        res.status(200).json({ msg: 'Meal removed from the meal plan successfully!' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
