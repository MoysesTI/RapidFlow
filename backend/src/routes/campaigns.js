const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const campaignController = require('../controllers/campaignController');

// Rotas protegidas (requerem autenticação do usuário)
router.post('/upload-contacts', authenticateToken, campaignController.uploadContacts);
router.post('/', authenticateToken, campaignController.createCampaign);
router.get('/', authenticateToken, campaignController.listCampaigns);
router.get('/:id', authenticateToken, campaignController.getCampaignDetails);
router.get('/:id/logs', authenticateToken, campaignController.getCampaignLogs);
router.post('/:id/execute', authenticateToken, campaignController.executeCampaign);

// =====================================================
// ROTAS DE CALLBACK (chamadas pelo n8n)
// Não requerem autenticação JWT pois vêm do n8n
// =====================================================
router.post('/:id/update-status', campaignController.updateMessageStatus);
router.post('/:id/progress', campaignController.updateProgress);
router.post('/:id/complete', campaignController.completeCampaign);

module.exports = router;