const multer = require('multer');
const { parseContactsBuffer } = require('../utils/fileParser');
const { pool } = require('../config/database');
const axios = require('axios');
const https = require('https');

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
    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.userId;

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

        res.json({ 
            success: true, 
            message: 'Campanha criada com sucesso', 
            campaign: result.rows[0] 
        });

    } catch (error) {
        console.error('Error creating campaign:', error);
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

        // ✅ REMOVIDO updated_at DAQUI
        await pool.query(
            'UPDATE campaigns SET status = $1 WHERE id = $2',
            ['running', id]
        );

        console.log('✅ Campaign sent successfully');

        res.json({
            success: true,
            message: 'Campanha iniciada com sucesso',
            campaignId: campaign.campaign_id
        });

    } catch (error) {
        console.error('Error executing campaign:', error);
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

        // Buscar campanha pelo campaign_id (string) ou id (number)
        const campaignResult = await pool.query(
            'SELECT id, user_id, sent_count, error_count FROM campaigns WHERE campaign_id = $1 OR id = $1',
            [id]
        );

        if (campaignResult.rows.length === 0) {
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
        } else if (status === 'error') {
            await pool.query(
                'UPDATE campaigns SET error_count = error_count + 1, last_update = NOW() WHERE id = $1',
                [campaign.id]
            );
        }

        res.json({
            success: true,
            message: 'Status atualizado com sucesso'
        });

    } catch (error) {
        console.error('Error updating message status:', error);
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
             RETURNING id, campaign_id, current_position, sent_count, error_count, total_contacts`,
            [currentPosition, sent, errors, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        res.json({
            success: true,
            message: 'Progresso atualizado',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Error updating progress:', error);
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
             RETURNING id, campaign_id, name, status, total_contacts, sent_count, error_count, success_rate`,
            [totalSent, totalErrors, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
        }

        console.log('✅ Campanha finalizada:', result.rows[0]);

        res.json({
            success: true,
            message: 'Campanha finalizada com sucesso',
            campaign: result.rows[0]
        });

    } catch (error) {
        console.error('Error completing campaign:', error);
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