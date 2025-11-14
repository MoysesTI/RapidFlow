const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log('🔧 Verificando banco de dados...');

        // Criar tabela de controle de migrations se não existir
        await pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(255),
                executed_at TIMESTAMP DEFAULT NOW()
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
            // Extrair número da versão do nome do arquivo (ex: "001" de "001_schema.sql")
            const versionMatch = file.match(/^(\d+)_/);
            const version = versionMatch ? parseInt(versionMatch[1]) : null;

            if (!version) {
                console.log(`⚠️  Pulando arquivo sem versão numérica: ${file}`);
                continue;
            }

            // Verificar se já foi executada
            const checkMigration = await pool.query(
                'SELECT version FROM schema_migrations WHERE version = $1',
                [version]
            );

            if (checkMigration.rows.length === 0) {
                console.log(`📊 Executando migration: ${migrationName}`);

                const sqlPath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(sqlPath, 'utf8');

                // Executar migration
                await pool.query(sql);

                // Registrar como executada
                await pool.query(
                    'INSERT INTO schema_migrations (version, name, executed_at) VALUES ($1, $2, NOW())',
                    [version, migrationName]
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
            const bcrypt = require('bcrypt');
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
