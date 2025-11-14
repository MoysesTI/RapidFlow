# ========================================
# SCRIPT DE RESET COMPLETO DO BANCO DE DADOS
# ========================================

Write-Host "🔄 Resetando banco de dados RapidFlow..." -ForegroundColor Cyan

# Configurações do banco
$env:PGPASSWORD = "docker"
$dbUser = "docker"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "rapidflow_db"

Write-Host ""
Write-Host "📊 Dropando banco de dados existente..." -ForegroundColor Yellow
& psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c "DROP DATABASE IF EXISTS $dbName;"

Write-Host ""
Write-Host "🆕 Criando novo banco de dados..." -ForegroundColor Green
& psql -U $dbUser -h $dbHost -p $dbPort -d postgres -c "CREATE DATABASE $dbName;"

Write-Host ""
Write-Host "📝 Executando migrations..." -ForegroundColor Cyan

# Executar migrations na ordem
$migrations = @(
    "001_schema.sql",
    "002_add_contacts_column.sql",
    "003_campaign_logs.sql",
    "004_campaign_events.sql",
    "005_custom_campaigns.sql"
)

foreach ($migration in $migrations) {
    $migrationPath = "migrations\$migration"
    if (Test-Path $migrationPath) {
        Write-Host "   ✅ Executando $migration" -ForegroundColor White
        & psql -U $dbUser -h $dbHost -p $dbPort -d $dbName -f $migrationPath
        if ($LASTEXITCODE -ne 0) {
            Write-Host "   ❌ Erro ao executar $migration" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "   ⚠️  Migration não encontrada: $migration" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🎯 Criando tabela de controle de migrations..." -ForegroundColor Cyan
$createMigrationsTable = @"
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255),
    executed_at TIMESTAMP DEFAULT NOW()
);

-- Registrar migrations já executadas
INSERT INTO schema_migrations (version, name) VALUES
    (1, '001_schema'),
    (2, '002_add_contacts_column'),
    (3, '003_campaign_logs'),
    (4, '004_campaign_events'),
    (5, '005_custom_campaigns');
"@

$createMigrationsTable | & psql -U $dbUser -h $dbHost -p $dbPort -d $dbName

Write-Host ""
Write-Host "👤 Criando usuário administrador..." -ForegroundColor Cyan

# Senha hash do bcrypt para '#serverprisma@dti'
$passwordHash = '$2a$10$vXzW8qJ.IkYxF.rGxHqX1.Y5dZJYzQZ5qGxH8xYzW8qJ.IkYxF.rG'

$createAdmin = @"
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('prismaAdministrador', 'admin@prismatech.com', '$passwordHash', 'Prisma', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;
"@

$createAdmin | & psql -U $dbUser -h $dbHost -p $dbPort -d $dbName

Write-Host ""
Write-Host "✅ BANCO DE DADOS RESETADO COM SUCESSO!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Credenciais do administrador:" -ForegroundColor Cyan
Write-Host "   Email: admin@prismatech.com" -ForegroundColor White
Write-Host "   Senha: #serverprisma@dti" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Você pode iniciar o servidor agora com: npm start" -ForegroundColor Cyan

# Limpar variável de senha
$env:PGPASSWORD = $null
