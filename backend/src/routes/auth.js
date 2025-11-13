const express = require('express');
const router = express.Router();
const { register, login, verifyAuth } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/security');

// Rate limit apenas em login
router.post('/register', register);
router.post('/login', loginLimiter, login);
router.get('/verify', authenticateToken, verifyAuth);

module.exports = router;