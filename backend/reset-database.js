#!/usr/bin/env node

/**
 * SCRIPT DE RESET COMPLETO DO BANCO DE DADOS
 * Execute com: node reset-database.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Cores para console
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(colors[color] + message + colors.reset);
}

async function resetDatabase() {
    log('\n🔄 Resetando banco de dados RapidFlow...', 'cyan');

    // Configuração do banco
    const dbConfig = {
        user: 'docker',
        password: 'docker',
        host: 'localhost',
        port: 5432,
        database: 'postgres' // Conecta ao postgres primeiro para dropar/criar o banco
    };

    const dbName = 'rapidflow_db';
    let client;

    try {
        // Conectar ao PostgreSQL
        log('\n📡 Conectando ao PostgreSQL...', 'cyan');
        client = new Client(dbConfig);
        await client.connect();
        log('✅ Conectado!', 'green');

        // Dropar banco existente
        log('\n📊 Dropando banco de dados existente...', 'yellow');
        await client.query(`DROP DATABASE IF EXISTS ${dbName};`);
        log('✅ Banco antigo removido!', 'green');

        // Criar novo banco
        log('\n🆕 Criando novo banco de dados...', 'green');
        await client.query(`CREATE DATABASE ${dbName};`);
        log('✅ Banco criado!', 'green');

        // Fechar conexão com postgres
        await client.end();

        // Conectar ao novo banco
        log('\n🔌 Conectando ao novo banco...', 'cyan');
        const newDbConfig = { ...dbConfig, database: dbName };
        client = new Client(newDbConfig);
        await client.connect();
        log('✅ Conectado ao rapidflow_db!', 'green');

        // Executar migrations
        log('\n📝 Executando migrations...', 'cyan');
        const migrations = [
            '001_schema.sql',
            '002_add_contacts_column.sql',
            '003_campaign_logs.sql',
            '004_campaign_events.sql',
            '005_custom_campaigns.sql'
        ];

        for (const migration of migrations) {
            const migrationPath = path.join(__dirname, 'migrations', migration);

            if (!fs.existsSync(migrationPath)) {
                log(`   ⚠️  Migration não encontrada: ${migration}`, 'yellow');
                continue;
            }

            log(`   ✅ Executando ${migration}`, 'white');
            const sql = fs.readFileSync(migrationPath, 'utf8');

            try {
                await client.query(sql);
            } catch (error) {
                log(`   ❌ Erro ao executar ${migration}: ${error.message}`, 'red');
                throw error;
            }
        }

        // Criar tabela de controle de migrations
        log('\n🎯 Criando tabela de controle de migrations...', 'cyan');
        await client.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(255),
                executed_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Registrar migrations executadas
        await client.query(`
            INSERT INTO schema_migrations (version, name) VALUES
                (1, '001_schema'),
                (2, '002_add_contacts_column'),
                (3, '003_campaign_logs'),
                (4, '004_campaign_events'),
                (5, '005_custom_campaigns')
            ON CONFLICT (version) DO NOTHING;
        `);
        log('✅ Tabela de controle criada!', 'green');

        // Criar usuário administrador
        log('\n👤 Criando usuário administrador...', 'cyan');
        const bcrypt = require('bcrypt');
        const passwordHash = await bcrypt.hash('#serverprisma@dti', 10);

        await client.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (email) DO NOTHING;
        `, ['prismaAdministrador', 'admin@prismatech.com', passwordHash, 'Prisma', 'Administrator', 'admin']);

        log('✅ Administrador criado!', 'green');

        // Fechar conexão
        await client.end();

        // Mensagem final
        log('\n✅ BANCO DE DADOS RESETADO COM SUCESSO!', 'green');
        log('\n📋 Credenciais do administrador:', 'cyan');
        log('   Email: admin@prismatech.com', 'white');
        log('   Senha: #serverprisma@dti', 'white');
        log('\n🚀 Você pode iniciar o servidor agora com: npm start\n', 'cyan');

    } catch (error) {
        log(`\n❌ ERRO: ${error.message}`, 'red');
        log('\n💡 Verifique se:', 'yellow');
        log('   - O PostgreSQL está rodando', 'white');
        log('   - As credenciais estão corretas (user: docker, password: docker)', 'white');
        log('   - A porta 5432 está disponível', 'white');

        if (client) {
            try {
                await client.end();
            } catch (e) {
                // Ignorar erro ao fechar
            }
        }

        process.exit(1);
    }
}

// Executar
resetDatabase();
