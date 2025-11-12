const { pool } = require('../config/database');
const { parseContactFile } = require('../utils/fileParser');
const fs = require('fs');

// Upload de arquivo de contatos
async function uploadContacts(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                error: true, 
                message: 'Nenhum arquivo enviado' 
            });
        }
        
        const filePath = req.file.path;
        const contacts = parseContactFile(filePath);
        
        // Limpar arquivo temporário
        fs.unlinkSync(filePath);
        
        if (contacts.length === 0) {
            return res.status(400).json({ 
                error: true, 
                message: 'Nenhum contato válido encontrado no arquivo' 
            });
        }
        
        res.json({
            success: true,
            message: `${contacts.length} contatos carregados com sucesso!`,
            contacts,
            count: contacts.length
        });
        
    } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        
        // Limpar arquivo em caso de erro
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao processar arquivo: ' + error.message 
        });
    }
}

// Criar campanha
async function createCampaign(req, res) {
    const client = await pool.connect();
    
    try {
        const userId = req.user.userId;
        const { name, contacts, config } = req.body;
        
        if (!name || !contacts || contacts.length === 0) {
            return res.status(400).json({ 
                error: true, 
                message: 'Nome da campanha e contatos são obrigatórios' 
            });
        }
        
        await client.query('BEGIN');
        
        // Gerar campaign ID
        const campaignId = `CAMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        // Inserir campanha
        const campaignResult = await client.query(
            `INSERT INTO campaigns (user_id, campaign_id, name, total_contacts, config)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, campaignId, name, contacts.length, JSON.stringify(config)]
        );
        
        const campaign = campaignResult.rows[0];
        
        // Inserir contatos
        for (let i = 0; i < contacts.length; i++) {
            const contact = contacts[i];
            await client.query(
                `INSERT INTO campaign_contacts 
                 (campaign_id, contact_name, phone, position)
                 VALUES ($1, $2, $3, $4)`,
                [campaign.id, contact.nome, contact.telefone, i + 1]
            );
        }
        
        // Log de auditoria
        await client.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, 'CAMPAIGN_CREATED', 'campaign', campaign.id, 
             JSON.stringify({ contacts: contacts.length }), req.ip]
        );
        
        await client.query('COMMIT');
        
        res.status(201).json({
            success: true,
            message: 'Campanha criada com sucesso!',
            campaign: {
                id: campaign.id,
                campaignId: campaign.campaign_id,
                name: campaign.name,
                totalContacts: campaign.total_contacts
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao criar campanha' 
        });
    } finally {
        client.release();
    }
}

// Listar campanhas do usuário
async function listCampaigns(req, res) {
    try {
        const userId = req.user.userId;
        const { limit = 50, offset = 0 } = req.query;
        
        const query = req.user.role === 'admin'
            ? 'SELECT c.*, u.username, u.email FROM campaigns c JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT $1 OFFSET $2'
            : 'SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3';
        
        const params = req.user.role === 'admin' 
            ? [limit, offset]
            : [userId, limit, offset];
        
        const result = await pool.query(query, params);
        
        res.json({
            success: true,
            campaigns: result.rows,
            count: result.rows.length
        });
        
    } catch (error) {
        console.error('Erro ao listar campanhas:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao listar campanhas' 
        });
    }
}

// Detalhes da campanha
async function getCampaignDetails(req, res) {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        
        // Buscar campanha
        const campaignQuery = req.user.role === 'admin'
            ? 'SELECT * FROM campaigns WHERE id = $1'
            : 'SELECT * FROM campaigns WHERE id = $1 AND user_id = $2';
        
        const campaignParams = req.user.role === 'admin' ? [id] : [id, userId];
        const campaignResult = await pool.query(campaignQuery, campaignParams);
        
        if (campaignResult.rows.length === 0) {
            return res.status(404).json({ 
                error: true, 
                message: 'Campanha não encontrada' 
            });
        }
        
        const campaign = campaignResult.rows[0];
        
        // Buscar contatos
        const contactsResult = await pool.query(
            'SELECT * FROM campaign_contacts WHERE campaign_id = $1 ORDER BY position',
            [id]
        );
        
        res.json({
            success: true,
            campaign,
            contacts: contactsResult.rows
        });
        
    } catch (error) {
        console.error('Erro ao obter detalhes:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao obter detalhes da campanha' 
        });
    }
}

module.exports = {
    uploadContacts,
    createCampaign,
    listCampaigns,
    getCampaignDetails
};
