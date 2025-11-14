const multer = require('multer');
const { parseContactsBuffer } = require('../utils/fileParser');
const { pool } = require('../config/database');
const axios = require('axios');
const https = require('https');

// Novos serviços
const websocketService = require('../services/websocket');
const analyticsService = require('../services/analytics');
const rateLimiterService = require('../services/rateLimiter');
const logger = require('../services/logger');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Criar agente HTTPS que ignora verificação de SSL
const httpsAgent = new https.Agent({  
    rejectUnauthorized: false
});

exports.uploadContacts = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            const contacts = await parseContactsBuffer(req.file.buffer, req.file.originalname);
            
            res.json({
                success: true,
                message: `${contacts.length} contatos carregados com sucesso`,
                contacts: contacts
            });

        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({ success: false, message: 'Erro: ' + error.message });
        }
    }
];

exports.createCampaign = async (req, res) => {
    const startTime = Date.now();

    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.userId;

        // Rate limiting
        const rateLimitCheck = await rateLimiterService.canCreateCampaign(userId);
        if (!rateLimitCheck.allowed) {
            logger.warn('Rate limit excedido', { userId, resetIn: rateLimitCheck.resetIn });
            return res.status(429).json({
                success: false,
                message: rateLimitCheck.message,
                resetIn: rateLimitCheck.resetIn
            });
        }

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({ success: false, message: 'Nenhum contato fornecido' });
        }

        const userConfigResult = await pool.query(
            'SELECT * FROM user_configs WHERE user_id = $1',
            [userId]
        );

        const userConfig = userConfigResult.rows[0] || {};
        
        const finalConfig = {
            webhookUrl: userConfig.webhook_url || config.webhookUrl || '',
            evolutionEndpoint: userConfig.evolution_endpoint || config.evolutionEndpoint || '',
            evolutionApiKey: userConfig.evolution_api_key || config.apiKey || '',
            openaiApiKey: userConfig.openai_api_key || config.openaiKey || '',
            imageUrl: config.imageUrl || '',
            delayMin: config.delayMin || 140,
            delayMax: config.delayMax || 380,
            openaiModel: config.openaiModel || 'gpt-4',
            systemPrompt: config.systemPrompt || 'Olá, tudo bem?'
        };

        console.log('Final config:', JSON.stringify(finalConfig));

        const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const result = await pool.query(
            `INSERT INTO campaigns (user_id, campaign_id, name, contacts, config, status, total_contacts, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING id, campaign_id, name, status, created_at`,
            [userId, campaignId, name, JSON.stringify(contacts), JSON.stringify(finalConfig), 'pending', contacts.length]
        );

        const campaign = result.rows[0];

        // Registrar evento de criação
        await analyticsService.trackEvent(campaign.id, 'campaign_created', {
            totalContacts: contacts.length,
            userId
        });

        // Notificar via WebSocket
        websocketService.notifyCampaignUpdate(campaignId, userId, {
            event: 'campaign_created',
            campaign: campaign
        });

        // Log
        logger.campaignLog(campaignId, 'created', {
            userId,
            totalContacts: contacts.length,
            duration: Date.now() - startTime
        });

        res.json({
            success: true,
            message: 'Campanha criada com sucesso',
            campaign: campaign,
            rateLimitRemaining: rateLimitCheck.remaining
        });

    } catch (error) {
        logger.error('Erro ao criar campanha', { error: error.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.executeCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        const result = await pool.query(
            'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const campaign = result.rows[0];
        const config = campaign.config;
        const contacts = campaign.contacts;

        // Buscar configurações do usuário para incluir useAI e maxRetries
        const userConfigResult = await pool.query(
            'SELECT use_ai, max_retries FROM user_configs WHERE user_id = $1',
            [userId]
        );

        const userSettings = userConfigResult.rows[0] || { use_ai: true, max_retries: 3 };

        const webhookPayload = {
            contacts: contacts,
            config: {
                evolutionEndpoint: config.evolutionEndpoint,
                evolutionApiKey: config.evolutionApiKey,
                openaiApiKey: config.openaiApiKey,
                imageUrl: config.imageUrl || '',
                delayMin: config.delayMin || 140,
                delayMax: config.delayMax || 380,
                openaiModel: config.openaiModel || 'gpt-4',
                systemPrompt: config.systemPrompt || 'Olá, tudo bem?',
                useAI: userSettings.use_ai !== undefined ? userSettings.use_ai : true,
                maxRetries: userSettings.max_retries || 3,
                backendUrl: process.env.BACKEND_URL || 'https://rapidflow-backend.onrender.com'
            },
            metadata: {
                totalContacts: contacts.length,
                startTime: new Date().toISOString(),
                campaignId: campaign.campaign_id
            }
        };

        console.log('Sending to webhook:', config.webhookUrl);

        // USAR httpsAgent PARA IGNORAR SSL
        await axios.post(config.webhookUrl, webhookPayload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000,
            httpsAgent: httpsAgent
        });

        // Atualizar status e marcar início
        await pool.query(
            'UPDATE campaigns SET status = $1, started_at = NOW() WHERE id = $2',
            ['running', id]
        );

        // Registrar evento
        await analyticsService.trackEvent(id, 'campaign_started', {
            totalContacts: contacts.length
        });

        // Notificar via WebSocket
        websocketService.notifyCampaignUpdate(campaign.campaign_id, userId, {
            event: 'campaign_started',
            totalContacts: contacts.length
        });

        logger.campaignLog(campaign.campaign_id, 'started', {
            userId,
            totalContacts: contacts.length
        });

        res.json({
            success: true,
            message: 'Campanha iniciada com sucesso',
            campaignId: campaign.campaign_id
        });

    } catch (error) {
        logger.error('Erro ao executar campanha', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao executar campanha: ' + error.message });
    }
};

exports.listCampaigns = async (req, res) => {
    try {
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT id, campaign_id, name, status, total_contacts, sent_count, error_count, created_at FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
            [userId]
        );
        res.json({ success: true, campaigns: result.rows });
    } catch (error) {
        console.error('Error listing campaigns:', error);
        res.status(500).json({ success: false, message: 'Erro ao listar campanhas' });
    }
};

exports.getCampaignDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const result = await pool.query(
            'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        res.json({ success: true, campaign: result.rows[0] });
    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar campanha' });
    }
};

// =====================================================
// NOVOS ENDPOINTS PARA CALLBACK DO N8N
// =====================================================

/**
 * Atualiza status de uma mensagem individual
 * POST /api/campaigns/:id/update-status
 */
exports.updateMessageStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { contactName, phone, status, messageText, errorMessage } = req.body;

        logger.debug('Callback recebido', { campaignId: id, status, phone });

        // Buscar campanha pelo campaign_id (string) ou id (number)
        const campaignResult = await pool.query(
            'SELECT id, campaign_id, user_id, sent_count, error_count FROM campaigns WHERE campaign_id = $1 OR id = $1',
            [id]
        );

        if (campaignResult.rows.length === 0) {
            logger.warn('Campanha não encontrada no callback', { campaignId: id });
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const campaign = campaignResult.rows[0];

        // Inserir log da mensagem
        await pool.query(
            `INSERT INTO campaign_message_logs (campaign_id, contact_name, phone, status, message_text, error_message, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                campaign.id,
                contactName,
                phone,
                status,
                messageText || '',
                errorMessage || null,
                status === 'sent' ? new Date() : null
            ]
        );

        // Atualizar contadores da campanha
        if (status === 'sent') {
            await pool.query(
                'UPDATE campaigns SET sent_count = sent_count + 1, last_update = NOW() WHERE id = $1',
                [campaign.id]
            );

            // Notificar sucesso via WebSocket
            websocketService.notifyMessageSent(campaign.campaign_id, campaign.user_id, {
                contactName,
                phone,
                messageText
            });

            // Registrar evento
            await analyticsService.trackEvent(campaign.id, 'message_sent', {
                contactName,
                phone
            });

        } else if (status === 'error') {
            await pool.query(
                'UPDATE campaigns SET error_count = error_count + 1, last_update = NOW() WHERE id = $1',
                [campaign.id]
            );

            // Notificar erro via WebSocket
            websocketService.notifyMessageError(campaign.campaign_id, campaign.user_id, {
                contactName,
                phone,
                errorMessage
            });

            // Registrar evento
            await analyticsService.trackEvent(campaign.id, 'message_error', {
                contactName,
                phone,
                errorMessage
            });

            logger.warn('Erro no envio de mensagem', {
                campaignId: campaign.campaign_id,
                phone,
                error: errorMessage
            });
        }

        res.json({
            success: true,
            message: 'Status atualizado com sucesso'
        });

    } catch (error) {
        logger.error('Erro ao atualizar status da mensagem', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao atualizar status: ' + error.message });
    }
};

/**
 * Atualiza progresso da campanha (a cada X mensagens)
 * POST /api/campaigns/:id/progress
 */
exports.updateProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPosition, sent, errors } = req.body;

        const result = await pool.query(
            `UPDATE campaigns
             SET current_position = $1,
                 sent_count = $2,
                 error_count = $3,
                 last_update = NOW()
             WHERE campaign_id = $4 OR id = $4
             RETURNING id, campaign_id, user_id, current_position, sent_count, error_count, total_contacts`,
            [currentPosition, sent, errors, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const campaign = result.rows[0];

        // Calcular porcentagem de progresso
        const progressPercentage = campaign.total_contacts > 0
            ? Math.round((currentPosition / campaign.total_contacts) * 100)
            : 0;

        // Notificar progresso via WebSocket
        websocketService.notifyProgress(campaign.campaign_id, campaign.user_id, {
            currentPosition,
            totalContacts: campaign.total_contacts,
            sent,
            errors,
            progressPercentage
        });

        // Registrar evento a cada 10%
        if (progressPercentage % 10 === 0) {
            await analyticsService.trackEvent(campaign.id, 'progress_milestone', {
                progress: progressPercentage,
                sent,
                errors
            });
        }

        res.json({
            success: true,
            message: 'Progresso atualizado',
            data: {
                ...campaign,
                progressPercentage
            }
        });

    } catch (error) {
        logger.error('Erro ao atualizar progresso', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao atualizar progresso' });
    }
};

/**
 * Finaliza campanha
 * POST /api/campaigns/:id/complete
 */
exports.completeCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const { totalSent, totalErrors } = req.body;

        const result = await pool.query(
            `UPDATE campaigns
             SET status = 'completed',
                 sent_count = $1,
                 error_count = $2,
                 success_rate = CASE
                     WHEN total_contacts > 0
                     THEN ROUND(($1::DECIMAL / total_contacts) * 100, 2)
                     ELSE 0
                 END,
                 completed_at = NOW(),
                 last_update = NOW()
             WHERE campaign_id = $3 OR id = $3
             RETURNING id, campaign_id, user_id, name, status, total_contacts, sent_count, error_count, success_rate, started_at, completed_at`,
            [totalSent, totalErrors, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const campaign = result.rows[0];

        // Calcular duração
        const duration = campaign.started_at && campaign.completed_at
            ? Math.round((new Date(campaign.completed_at) - new Date(campaign.started_at)) / 1000)
            : null;

        // Registrar evento de conclusão
        await analyticsService.trackEvent(campaign.id, 'campaign_completed', {
            totalSent,
            totalErrors,
            successRate: campaign.success_rate,
            duration
        });

        // Notificar conclusão via WebSocket
        websocketService.notifyCampaignComplete(campaign.campaign_id, campaign.user_id, {
            totalSent,
            totalErrors,
            successRate: campaign.success_rate,
            duration
        });

        logger.campaignLog(campaign.campaign_id, 'completed', {
            totalSent,
            totalErrors,
            successRate: campaign.success_rate,
            duration
        });

        res.json({
            success: true,
            message: 'Campanha finalizada com sucesso',
            campaign: {
                ...campaign,
                duration
            }
        });

    } catch (error) {
        logger.error('Erro ao finalizar campanha', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao finalizar campanha' });
    }
};

/**
 * Busca logs de mensagens de uma campanha
 * GET /api/campaigns/:id/logs
 */
exports.getCampaignLogs = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar se campanha pertence ao usuário
        const campaignResult = await pool.query(
            'SELECT id FROM campaigns WHERE (campaign_id = $1 OR id = $1) AND user_id = $2',
            [id, userId]
        );

        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const campaignDbId = campaignResult.rows[0].id;

        // Buscar logs
        const logsResult = await pool.query(
            `SELECT id, contact_name, phone, status, message_text, error_message, sent_at, created_at
             FROM campaign_message_logs
             WHERE campaign_id = $1
             ORDER BY created_at DESC
             LIMIT 100`,
            [campaignDbId]
        );

        res.json({
            success: true,
            logs: logsResult.rows
        });

    } catch (error) {
        console.error('Error fetching campaign logs:', error);
        res.status(500).json({ success: false, message: 'Erro ao buscar logs' });
    }
};

// =====================================================
// NOVOS ENDPOINTS DE ANALYTICS
// =====================================================

/**
 * Retorna métricas detalhadas de uma campanha
 * GET /api/campaigns/:id/metrics
 */
exports.getCampaignMetrics = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar permissão
        const checkPermission = await pool.query(
            'SELECT id FROM campaigns WHERE (campaign_id = $1 OR id = $1) AND user_id = $2',
            [id, userId]
        );

        if (checkPermission.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const metrics = await analyticsService.getCampaignMetrics(id);

        if (!metrics) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        // Calcular health score
        const healthScore = analyticsService.calculateHealthScore(metrics);

        res.json({
            success: true,
            metrics: {
                ...metrics,
                health_score: healthScore
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar métricas', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao buscar métricas' });
    }
};

/**
 * Retorna dashboard do usuário
 * GET /api/campaigns/dashboard
 */
exports.getUserDashboard = async (req, res) => {
    try {
        const userId = req.user.userId;
        const dashboard = await analyticsService.getUserDashboard(userId);

        res.json({
            success: true,
            dashboard
        });

    } catch (error) {
        logger.error('Erro ao gerar dashboard', { error: error.message, userId: req.user?.userId });
        res.status(500).json({ success: false, message: 'Erro ao gerar dashboard' });
    }
};

/**
 * Retorna análise de performance de uma campanha
 * GET /api/campaigns/:id/performance
 */
exports.getCampaignPerformance = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar permissão
        const checkPermission = await pool.query(
            'SELECT id FROM campaigns WHERE (campaign_id = $1 OR id = $1) AND user_id = $2',
            [id, userId]
        );

        if (checkPermission.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const performance = await analyticsService.getMessagePerformance(id);

        if (!performance) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        res.json({
            success: true,
            performance
        });

    } catch (error) {
        logger.error('Erro ao analisar performance', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao analisar performance' });
    }
};

/**
 * Exporta relatório completo da campanha
 * GET /api/campaigns/:id/export
 */
exports.exportCampaignReport = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // Verificar permissão
        const checkPermission = await pool.query(
            'SELECT id FROM campaigns WHERE (campaign_id = $1 OR id = $1) AND user_id = $2',
            [id, userId]
        );

        if (checkPermission.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        const report = await analyticsService.exportCampaignReport(id);

        if (!report) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        res.json({
            success: true,
            report
        });

    } catch (error) {
        logger.error('Erro ao exportar relatório', { error: error.message, campaignId: id });
        res.status(500).json({ success: false, message: 'Erro ao exportar relatório' });
    }
};