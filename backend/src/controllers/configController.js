const { pool } = require('../config/database');

// Obter configurações do usuário
async function getConfig(req, res) {
    try {
        const userId = req.user.userId;
        
        const result = await pool.query(
            'SELECT * FROM user_configs WHERE user_id = $1',
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: true, 
                message: 'Configurações não encontradas' 
            });
        }
        
        const config = result.rows[0];
        
        // Ocultar API keys para usuários não-admin
        if (req.user.role !== 'admin') {
            config.evolution_api_key = config.evolution_api_key ? '***OCULTO***' : null;
            config.openai_api_key = config.openai_api_key ? '***OCULTO***' : null;
        }
        
        res.json({
            success: true,
            config
        });
        
    } catch (error) {
        console.error('Erro ao obter config:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao obter configurações' 
        });
    }
}

// Atualizar configurações
async function updateConfig(req, res) {
    try {
        const userId = req.user.userId;
        const {
            webhookUrl,
            evolutionEndpoint,
            evolutionApiKey,
            openaiApiKey,
            imageUrl,
            delayMin,
            delayMax,
            openaiModel,
            systemPrompt
        } = req.body;
        
        // Usuários comuns não podem alterar certas configurações
        if (req.user.role !== 'admin') {
            if (evolutionApiKey || openaiApiKey) {
                return res.status(403).json({
                    error: true,
                    message: 'Apenas administradores podem alterar API keys'
                });
            }
        }
        
        const result = await pool.query(
            `UPDATE user_configs 
             SET webhook_url = COALESCE($1, webhook_url),
                 evolution_endpoint = COALESCE($2, evolution_endpoint),
                 evolution_api_key = COALESCE($3, evolution_api_key),
                 openai_api_key = COALESCE($4, openai_api_key),
                 image_url = COALESCE($5, image_url),
                 delay_min = COALESCE($6, delay_min),
                 delay_max = COALESCE($7, delay_max),
                 openai_model = COALESCE($8, openai_model),
                 system_prompt = COALESCE($9, system_prompt),
                 updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $10
             RETURNING *`,
            [webhookUrl, evolutionEndpoint, evolutionApiKey, openaiApiKey, 
             imageUrl, delayMin, delayMax, openaiModel, systemPrompt, userId]
        );
        
        // Log de auditoria
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, ip_address) VALUES ($1, $2, $3, $4)',
            [userId, 'CONFIG_UPDATED', 'config', req.ip]
        );
        
        res.json({
            success: true,
            message: 'Configurações atualizadas com sucesso!',
            config: result.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar config:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao atualizar configurações' 
        });
    }
}

module.exports = { getConfig, updateConfig };
