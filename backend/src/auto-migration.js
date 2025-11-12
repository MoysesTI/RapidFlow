const { pool } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log('🔧 Verificando banco de dados...');
        
        // Ler arquivo SQL
        const sqlPath = path.join(__dirname, '../migrations/001_schema.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Verificar se tabela users existe
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        
        if (!checkTable.rows[0].exists) {
            console.log('📊 Criando tabelas...');
            
            // Executar migrations
            await pool.query(sql);
            console.log('✅ Tabelas criadas!');
            
            // Criar usuário admin
            const bcrypt = require('bcryptjs');
            const adminPassword = await bcrypt.hash('#serverprisma@dti', 10);
            
            await pool.query(`
                INSERT INTO users (username, email, password, first_name, last_name, role)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (email) DO NOTHING
            `, ['prismaAdministrador', 'admin@prismatech.com', adminPassword, 'Prisma', 'Administrator', 'admin']);
            
            console.log('✅ Administrador criado!');
        } else {
            console.log('✅ Banco de dados já configurado!');
        }
        
    } catch (error) {
        console.error('❌ Erro ao configurar banco:', error);
        throw error;
    }
}

module.exports = { runMigrations };
