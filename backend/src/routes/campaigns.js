const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const campaignController = require('../controllers/campaignController');
const {
    validateCampaignPayload,
    validateN8nCallback,
    validateProgressUpdate
} = require('../middleware/validation');

// =====================================================
// ROTAS PROTEGIDAS (requerem autenticação do usuário)
// =====================================================
router.post('/upload-contacts', authenticateToken, campaignController.uploadContacts);
router.post('/', authenticateToken, validateCampaignPayload, campaignController.createCampaign);
router.get('/', authenticateToken, campaignController.listCampaigns);
router.get('/dashboard', authenticateToken, campaignController.getUserDashboard);
router.get('/:id', authenticateToken, campaignController.getCampaignDetails);
router.get('/:id/logs', authenticateToken, campaignController.getCampaignLogs);
router.get('/:id/metrics', authenticateToken, campaignController.getCampaignMetrics);
router.get('/:id/performance', authenticateToken, campaignController.getCampaignPerformance);
router.get('/:id/export', authenticateToken, campaignController.exportCampaignReport);
router.post('/:id/execute', authenticateToken, campaignController.executeCampaign);

// =====================================================
// ROTAS DE CALLBACK (chamadas pelo n8n)
// Não requerem autenticação JWT pois vêm do n8n
// Incluem validação de dados
// =====================================================
router.post('/:id/update-status', validateN8nCallback, campaignController.updateMessageStatus);
router.post('/:id/progress', validateProgressUpdate, campaignController.updateProgress);
router.post('/:id/complete', campaignController.completeCampaign);

module.exports = router;