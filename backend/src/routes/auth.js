const express = require('express');
const router = express.Router();
const { register, login, verifyAuth } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/verify', authenticateToken, verifyAuth);

module.exports = router;