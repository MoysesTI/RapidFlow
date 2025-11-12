const { pool } = require('../config/database');

// Obter configurações do usuário
async function getConfig(req, res) {
    try {
        const userId = req.user.userId;
        const isAdmin = req.user.role === 'admin';
        
        const result = await pool.query(
            'SELECT * FROM user_configs WHERE user_id = $1',
            [userId]
        );
        
        let config;
        
        if (result.rows.length === 0) {
            // Criar configuração padrão se não existir
            const defaultConfig = await pool.query(
                `INSERT INTO user_configs (
                    user_id, 
                    webhook_url, 
                    evolution_endpoint, 
                    evolution_api_key,
                    image_url,
                    delay_min,
                    delay_max,
                    openai_model,
                    system_prompt
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [
                    userId,
                    process.env.DEFAULT_WEBHOOK_URL || '',
                    process.env.DEFAULT_EVOLUTION_ENDPOINT || '',
                    process.env.DEFAULT_EVOLUTION_API_KEY || '',
                    '',
                    140,
                    380,
                    'gpt-4',
                    'Olá, tudo bem?'
                ]
            );
            config = defaultConfig.rows[0];
        } else {
            config = result.rows[0];
        }
        
        // SEGURANÇA: Ocultar dados sensíveis de não-admin
        if (!isAdmin) {
            config.evolution_api_key = null; // Não mostrar nada
            config.openai_api_key = null;
            config.evolution_endpoint = null; // Também ocultar endpoint
        }
        
        res.json({
            success: true,
            config,
            isAdmin // Informar se é admin
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
        const isAdmin = req.user.role === 'admin';
        
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
        
        // SEGURANÇA: Apenas admin pode alterar configurações sensíveis
        let updateQuery;
        let params;
        
        if (isAdmin) {
            // Admin pode atualizar tudo
            updateQuery = `
                UPDATE user_configs 
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
                RETURNING *
            `;
            params = [webhookUrl, evolutionEndpoint, evolutionApiKey, openaiApiKey, 
                     imageUrl, delayMin, delayMax, openaiModel, systemPrompt, userId];
        } else {
            // Usuário comum só pode atualizar campos não sensíveis
            updateQuery = `
                UPDATE user_configs 
                SET webhook_url = COALESCE($1, webhook_url),
                    image_url = COALESCE($2, image_url),
                    delay_min = COALESCE($3, delay_min),
                    delay_max = COALESCE($4, delay_max),
                    system_prompt = COALESCE($5, system_prompt),
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $6
                RETURNING *
            `;
            params = [webhookUrl, imageUrl, delayMin, delayMax, systemPrompt, userId];
        }
        
        const result = await pool.query(updateQuery, params);
        
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