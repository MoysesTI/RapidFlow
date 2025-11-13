const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log('🔧 Verificando banco de dados...');

        // Criar tabela de controle de migrations se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id SERIAL PRIMARY KEY,
                migration_name VARCHAR(255) UNIQUE NOT NULL,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Listar todos os arquivos de migration
        const migrationsDir = path.join(__dirname, '../migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Ordena alfabeticamente (001, 002, etc)

        console.log(`📁 Encontradas ${migrationFiles.length} migrations`);

        // Executar cada migration se ainda não foi executada
        for (const file of migrationFiles) {
            const migrationName = file.replace('.sql', '');

            // Verificar se já foi executada
            const checkMigration = await pool.query(
                'SELECT id FROM schema_migrations WHERE migration_name = $1',
                [migrationName]
            );

            if (checkMigration.rows.length === 0) {
                console.log(`📊 Executando migration: ${migrationName}`);

                const sqlPath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(sqlPath, 'utf8');

                // Executar migration
                await pool.query(sql);

                // Registrar como executada
                await pool.query(
                    'INSERT INTO schema_migrations (migration_name) VALUES ($1)',
                    [migrationName]
                );

                console.log(`✅ Migration ${migrationName} executada com sucesso!`);
            } else {
                console.log(`⏭️  Migration ${migrationName} já executada`);
            }
        }

        // Verificar se usuário admin existe
        const checkAdmin = await pool.query(
            "SELECT id FROM users WHERE email = 'admin@prismatech.com'"
        );

        if (checkAdmin.rows.length === 0) {
            console.log('👤 Criando usuário administrador...');
            const bcrypt = require('bcryptjs');
            const adminPassword = await bcrypt.hash('#serverprisma@dti', 10);

            await pool.query(`
                INSERT INTO users (username, email, password_hash, first_name, last_name, role)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, ['prismaAdministrador', 'admin@prismatech.com', adminPassword, 'Prisma', 'Administrator', 'admin']);

            console.log('✅ Administrador criado!');
            console.log('   Email: admin@prismatech.com');
            console.log('   Senha: #serverprisma@dti');
        }

        console.log('✅ Banco de dados configurado e atualizado!');

    } catch (error) {
        console.error('❌ Erro ao configurar banco:', error);
        throw error;
    }
}

module.exports = { runMigrations };
