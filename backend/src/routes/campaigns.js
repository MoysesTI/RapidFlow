const express = require('express');
const router = express.Router();
const {
    uploadContacts,
    createCampaign,
    listCampaigns,
    getCampaignDetails
} = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

// REMOVIDO: configuração de multer (agora está no controller)

// uploadContacts já vem com multer.memoryStorage() configurado
router.post('/upload-contacts', authenticateToken, ...uploadContacts);
router.post('/', authenticateToken, createCampaign);
router.get('/', authenticateToken, listCampaigns);
router.get('/:id', authenticateToken, getCampaignDetails);

module.exports = router;