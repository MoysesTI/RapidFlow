const { pool } = require('./database');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
    try {
        console.log('🔧 Verificando banco de dados...');

        // 1. Criar tabela de usuários se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Criar tabela de configurações de usuário
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_configs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                webhook_url TEXT,
                evolution_endpoint TEXT,
                evolution_api_key TEXT,
                openai_api_key TEXT,
                image_url TEXT,
                delay_min INTEGER DEFAULT 140,
                delay_max INTEGER DEFAULT 380,
                openai_model VARCHAR(100) DEFAULT 'gpt-4',
                system_prompt TEXT DEFAULT 'Olá, tudo bem?',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id)
            )
        `);

        // 3. Criar tabela de campanhas
        await pool.query(`
            CREATE TABLE IF NOT EXISTS campaigns (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                campaign_id VARCHAR(255) UNIQUE,
                name VARCHAR(255) NOT NULL,
                contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
                config JSONB NOT NULL DEFAULT '{}'::jsonb,
                status VARCHAR(50) DEFAULT 'pending',
                total_contacts INTEGER DEFAULT 0,
                sent_count INTEGER DEFAULT 0,
                error_count INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Criar índices
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
            CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
            CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
            CREATE INDEX IF NOT EXISTS idx_user_configs_user_id ON user_configs(user_id);
        `);

        // 5. Criar tabela de logs de auditoria
        await pool.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                action VARCHAR(100),
                entity_type VARCHAR(100),
                entity_id INTEGER,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 6. Executar migrations pendentes
        const migrationsDir = path.join(__dirname, '../migrations');
        if (fs.existsSync(migrationsDir)) {
            const migrations = fs.readdirSync(migrationsDir)
                .filter(file => file.endsWith('.sql'))
                .sort();

            for (const migration of migrations) {
                const migrationPath = path.join(migrationsDir, migration);
                const sql = fs.readFileSync(migrationPath, 'utf8');
                
                console.log(`📄 Executando migration: ${migration}`);
                await pool.query(sql);
            }
        }

        console.log('✅ Banco de dados configurado');
        return true;

    } catch (error) {
        console.error('❌ Erro ao configurar banco:', error);
        throw error;
    }
}

async function checkDatabase() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Banco de dados já configurado!');
        return true;
    } catch (error) {
        console.log('⚠️  Banco precisa ser configurado');
        return false;
    }
}

module.exports = { setupDatabase, checkDatabase };