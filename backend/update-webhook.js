// =====================================================
// SCRIPT: Atualizar Webhook URLs no Banco de Dados
// =====================================================
// Uso: node update-webhook.js
// =====================================================

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function updateWebhooks() {
    try {
        console.log('🔄 Conectando ao banco de dados...');

        // Mostrar configurações atuais
        console.log('\n📋 Configurações ANTES da atualização:');
        const before = await pool.query('SELECT user_id, webhook_url FROM user_configs');
        console.table(before.rows);

        // Atualizar webhooks de teste para produção
        console.log('\n🔧 Atualizando webhooks...');
        const result = await pool.query(`
            UPDATE user_configs
            SET webhook_url = $1
            WHERE webhook_url LIKE '%webhook-test%'
            RETURNING user_id, webhook_url
        `, ['https://webhook.automacaoklyon.com/webhook/prisma-campaign']);

        console.log(`✅ ${result.rowCount} registro(s) atualizado(s)`);

        // Mostrar configurações após atualização
        console.log('\n📋 Configurações DEPOIS da atualização:');
        const after = await pool.query('SELECT user_id, webhook_url FROM user_configs');
        console.table(after.rows);

        console.log('\n✅ Atualização concluída com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao atualizar webhooks:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

updateWebhooks();
