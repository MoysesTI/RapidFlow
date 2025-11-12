const multer = require('multer');
const path = require('path');
const { parseContactsBuffer } = require('../utils/fileParser');
const { pool } = require('../config/database');

console.log('==== CAMPAIGN CONTROLLER WITH MEMORY STORAGE - V3 ====');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadContacts = [
    upload.single('file'),
    async (req, res) => {
        console.log('==== UPLOAD START (MEMORY) ====');
        
        try {
            if (!req.file) {
                console.log('No file received');
                return res.status(400).json({ 
                    success: false, 
                    message: 'No file uploaded' 
                });
            }

            console.log('File:', req.file.originalname);
            console.log('Size:', req.file.size, 'bytes');
            console.log('Buffer length:', req.file.buffer.length);

            const contacts = await parseContactsBuffer(req.file.buffer, req.file.originalname);
            
            console.log('Contacts loaded:', contacts.length);
            console.log('==== UPLOAD SUCCESS ====');

            res.json({
                success: true,
                message: `${contacts.length} contatos carregados com sucesso`,
                contacts: contacts
            });

        } catch (error) {
            console.error('==== UPLOAD ERROR ====');
            console.error('Error:', error.message);

            res.status(500).json({
                success: false,
                message: 'Erro: ' + error.message
            });
        }
    }
];

exports.createCampaign = async (req, res) => {
    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.userId;

        console.log('Creating campaign for user:', userId);
        console.log('Contacts count:', contacts?.length);
        console.log('Config received:', JSON.stringify(config));

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nenhum contato fornecido' 
            });
        }

        // Buscar configurações do usuário
        const userConfigResult = await pool.query(
            'SELECT * FROM user_configs WHERE user_id = $1',
            [userId]
        );

        // Mesclar configurações: prioridade para config do body, depois user_configs, depois env
        const finalConfig = {
            webhookUrl: config.webhookUrl || userConfigResult.rows[0]?.webhook_url || process.env.DEFAULT_WEBHOOK_URL,
            evolutionEndpoint: config.evolutionEndpoint || userConfigResult.rows[0]?.evolution_endpoint || process.env.DEFAULT_EVOLUTION_ENDPOINT,
            evolutionApiKey: config.apiKey || userConfigResult.rows[0]?.evolution_api_key || process.env.DEFAULT_EVOLUTION_API_KEY,
            openaiApiKey: config.openaiKey || userConfigResult.rows[0]?.openai_api_key || process.env.DEFAULT_OPENAI_API_KEY,
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

        console.log('Campaign created:', result.rows[0].campaign_id);

        res.json({ 
            success: true, 
            message: 'Campanha criada com sucesso', 
            campaign: result.rows[0] 
        });

    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
};

exports.listCampaigns = async (req, res) => {
    try {
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        let query = 'SELECT id, campaign_id, name, status, total_contacts, sent_count, error_count, created_at FROM campaigns';
        let params = [];

        if (!isAdmin) {
            query += ' WHERE user_id = $1';
            params.push(userId);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';
        const result = await pool.query(query, params);

        res.json({ 
            success: true, 
            campaigns: result.rows 
        });

    } catch (error) {
        console.error('Error listing campaigns:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao listar campanhas' 
        });
    }
};

exports.getCampaignDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';

        let query = 'SELECT * FROM campaigns WHERE id = $1';
        let params = [id];

        if (!isAdmin) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Campanha não encontrada' 
            });
        }

        res.json({ 
            success: true, 
            campaign: result.rows[0] 
        });

    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao buscar campanha' 
        });
    }
};