const express = require('express');
const { register, login } = require('../controllers/authController');
const auth = require('../middlewares/auth');
const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Example of a protected route
router.get('/profile', auth, (req, res) => {
    res.json({ msg: 'Welcome to your profile', userId: req.user });
});

module.exports = router;
