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
                systemPrompt: config.systemPrompt || 'Olá, tudo bem?'
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
            httpsAgent: httpsAgent  // ← ADICIONAR ISTO
        });

        await pool.query(
            'UPDATE campaigns SET status = $1, updated_at = NOW() WHERE id = $2',
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