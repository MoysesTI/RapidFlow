const { pool } = require('../config/database');

async function getConfig(req, res) {
    try {
        const userId = req.user.userId;
        
        const result = await pool.query(
            'SELECT * FROM user_configs WHERE user_id = $1',
            [userId]
        );
        
        let config;
        
        if (result.rows.length === 0) {
            const defaults = {
                webhook_url: process.env.DEFAULT_WEBHOOK_URL || 'https://webhook.automacaoklyon.com/webhook/prisma-campaign',
                evolution_endpoint: process.env.DEFAULT_EVOLUTION_ENDPOINT || 'https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem',
                evolution_api_key: process.env.DEFAULT_EVOLUTION_API_KEY || 'FBAF0775D817-45C7-9ACC-F7720DDAA9E2',
                openai_api_key: process.env.DEFAULT_OPENAI_API_KEY || ''
            };
            
            const defaultConfig = await pool.query(
                `INSERT INTO user_configs (
                    user_id, webhook_url, evolution_endpoint, evolution_api_key, 
                    openai_api_key, delay_min, delay_max, openai_model, system_prompt
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *`,
                [userId, defaults.webhook_url, defaults.evolution_endpoint, 
                 defaults.evolution_api_key, defaults.openai_api_key,
                 140, 380, 'gpt-4', 'Olá, tudo bem?']
            );
            config = defaultConfig.rows[0];
        } else {
            config = result.rows[0];
        }
        
        res.json({ success: true, config });
        
    } catch (error) {
        console.error('Erro ao obter config:', error);
        res.status(500).json({ error: true, message: 'Erro ao obter configurações' });
    }
}

async function updateConfig(req, res) {
    try {
        const userId = req.user.userId;
        const { webhookUrl, evolutionEndpoint, evolutionApiKey, openaiApiKey } = req.body;
        
        console.log('Updating config for user:', userId);
        
        await pool.query(
            `INSERT INTO user_configs (
                user_id, webhook_url, evolution_endpoint, evolution_api_key, openai_api_key, updated_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())
            ON CONFLICT (user_id) 
            DO UPDATE SET 
                webhook_url = EXCLUDED.webhook_url,
                evolution_endpoint = EXCLUDED.evolution_endpoint,
                evolution_api_key = EXCLUDED.evolution_api_key,
                openai_api_key = EXCLUDED.openai_api_key,
                updated_at = NOW()`,
            [userId, webhookUrl, evolutionEndpoint, evolutionApiKey, openaiApiKey]
        );
        
        const result = await pool.query(
            'SELECT * FROM user_configs WHERE user_id = $1',
            [userId]
        );
        
        res.json({
            success: true,
            message: 'Configurações atualizadas com sucesso!',
            config: result.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao atualizar config:', error);
        res.status(500).json({ error: true, message: 'Erro ao atualizar configurações' });
    }
}

module.exports = { getConfig, updateConfig };