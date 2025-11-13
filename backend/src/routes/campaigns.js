const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const campaignController = require('../controllers/campaignController');

router.post('/upload-contacts', authenticateToken, campaignController.uploadContacts);
router.post('/', authenticateToken, campaignController.createCampaign);
router.get('/', authenticateToken, campaignController.listCampaigns);
router.get('/:id', authenticateToken, campaignController.getCampaignDetails);
router.post('/:id/execute', authenticateToken, campaignController.executeCampaign);

module.exports = router;