const express = require('express');
const router = express.Router();
const { getConfig, updateConfig } = require('../controllers/configController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, getConfig);
router.put('/', authenticateToken, updateConfig);

module.exports = router;
