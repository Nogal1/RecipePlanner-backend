const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');  // Ensure user is authenticated
const db = require('../config/db');

// Add a meal to the meal plan
router.post('/add', verifyToken, async (req, res) => {
    const { recipe_id, day_of_week, meal_type } = req.body;
    const user_id = req.user.id;

    try {
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

// Fetch a user's meal plan
router.get('/', verifyToken, async (req, res) => {
    const user_id = req.user.id;

    try {
        const result = await db.query(
            'SELECT meal_plans.*, recipes.title, recipes.image_url FROM meal_plans JOIN recipes ON meal_plans.recipe_id = recipes.id WHERE meal_plans.user_id = $1 ORDER BY meal_plans.day_of_week',
            [user_id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});

// Delete a meal from the meal plan
router.delete('/delete/:id', verifyToken, async (req, res) => {
    const plan_id = req.params.id;
    const user_id = req.user.id;

    try {
        await db.query('DELETE FROM meal_plans WHERE id = $1 AND user_id = $2', [plan_id, user_id]);
        res.status(200).json({ msg: 'Meal removed from the meal plan successfully!' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
});



module.exports = router;
