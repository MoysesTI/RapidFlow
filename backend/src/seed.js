const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');
require('dotenv').config();

async function seedDatabase() {
    try {
        console.log('🌱 Iniciando seed do banco de dados...');
        
        const username = process.env.ADMIN_USERNAME || 'prismaAdministrador';
        const password = process.env.ADMIN_PASSWORD || '#serverprisma@dti';
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Verificar se admin já existe
        const check = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
        
        if (check.rows.length > 0) {
            console.log('⚠️  Administrador já existe');
            process.exit(0);
        }
        
        // Criar admin
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active)
             VALUES ($1, $2, $3, $4, $5, $6, true)
             RETURNING id`,
            [username, 'admin@prismatech.com', passwordHash, 'Prisma', 'Administrator', 'admin']
        );
        
        const adminId = result.rows[0].id;
        
        // Criar configuração padrão para admin
        await pool.query(
            `INSERT INTO user_configs (user_id, webhook_url, evolution_endpoint, evolution_api_key, system_prompt)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                adminId,
                process.env.DEFAULT_WEBHOOK_URL,
                process.env.DEFAULT_EVOLUTION_ENDPOINT,
                process.env.DEFAULT_EVOLUTION_API_KEY,
                `🧠 SISTEMA DE GERAÇÃO DE MENSAGENS — PRISMATECH

🎯 CONTEXTO DA EMPRESA
Você é o assistente de comunicação oficial da PrismaTech Code Academy.

🎁 CAMPANHA ATUAL
Gere mensagens personalizadas e motivadoras.

🧩 TAREFA
Gerar uma mensagem curta (máx 300 caracteres), única e personalizada.

⚙️ REGRAS
- Use o primeiro nome
- Tom amigável e motivador
- Cada mensagem deve ter estrutura diferente
- Emojis opcionais`
            ]
        );
        
        console.log('✅ Administrador criado com sucesso!');
        console.log(`   Usuário: ${username}`);
        console.log(`   Senha: ${password}`);
        console.log('');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Erro ao criar seed:', error);
        process.exit(1);
    }
}

seedDatabase();
