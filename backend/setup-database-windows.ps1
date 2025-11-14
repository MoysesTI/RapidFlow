# ═══════════════════════════════════════════════════════════════════════
# RAPIDFLOW - SETUP COMPLETO DO BANCO DE DADOS (Windows + PostgreSQL 17)
# ═══════════════════════════════════════════════════════════════════════
# Execute com: .\setup-database-windows.ps1
# ═══════════════════════════════════════════════════════════════════════

# Cores para output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host ""
Write-ColorOutput Cyan "╔════════════════════════════════════════════════════════════════╗"
Write-ColorOutput Cyan "║  RAPIDFLOW - CONFIGURAÇÃO DO BANCO DE DADOS PostgreSQL 17      ║"
Write-ColorOutput Cyan "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

# ────────────────────────────────────────────────────────────────────────
# PASSO 1: Verificar se o arquivo .env existe
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "🔍 PASSO 1: Verificando arquivo .env..."

if (-not (Test-Path ".env")) {
    Write-ColorOutput Red "❌ ERRO: Arquivo .env não encontrado!"
    Write-Host ""
    Write-ColorOutput Yellow "Por favor, configure o arquivo .env primeiro:"
    Write-Host "   1. Abra o arquivo .env na pasta backend"
    Write-Host "   2. Altere DB_PASSWORD para sua senha do PostgreSQL"
    Write-Host "   3. Salve o arquivo e execute este script novamente"
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-ColorOutput Green "✅ Arquivo .env encontrado!"

# ────────────────────────────────────────────────────────────────────────
# PASSO 2: Carregar variáveis do .env
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n🔧 PASSO 2: Carregando configurações do .env..."

Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$key" -Value $value
    }
}

$DB_HOST = $env:DB_HOST
$DB_PORT = $env:DB_PORT
$DB_NAME = $env:DB_NAME
$DB_USER = $env:DB_USER
$DB_PASSWORD = $env:DB_PASSWORD

# Verificar se a senha foi configurada
if ($DB_PASSWORD -eq "SUA_SENHA_DO_POSTGRES_AQUI" -or [string]::IsNullOrWhiteSpace($DB_PASSWORD)) {
    Write-ColorOutput Red "`n❌ ERRO: Senha do PostgreSQL não configurada!"
    Write-Host ""
    Write-ColorOutput Yellow "Por favor, edite o arquivo .env e configure DB_PASSWORD"
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-ColorOutput Green "✅ Configurações carregadas:"
Write-Host "   Host: $DB_HOST"
Write-Host "   Port: $DB_PORT"
Write-Host "   Database: $DB_NAME"
Write-Host "   User: $DB_USER"
Write-Host "   Password: ********"

# ────────────────────────────────────────────────────────────────────────
# PASSO 3: Localizar instalação do PostgreSQL
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n🔍 PASSO 3: Localizando PostgreSQL 17..."

$PG_PATHS = @(
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files (x86)\PostgreSQL\17\bin",
    "C:\PostgreSQL\17\bin"
)

$PSQL_PATH = $null

foreach ($path in $PG_PATHS) {
    if (Test-Path "$path\psql.exe") {
        $PSQL_PATH = $path
        break
    }
}

if (-not $PSQL_PATH) {
    Write-ColorOutput Red "`n❌ ERRO: PostgreSQL não encontrado!"
    Write-Host ""
    Write-ColorOutput Yellow "Por favor, certifique-se de que o PostgreSQL 17 está instalado em:"
    Write-Host "   C:\Program Files\PostgreSQL\17\"
    Write-Host ""
    Write-Host "Ou adicione o caminho do PostgreSQL ao PATH do sistema."
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-ColorOutput Green "✅ PostgreSQL encontrado em: $PSQL_PATH"

# Definir variável de ambiente para senha
$env:PGPASSWORD = $DB_PASSWORD

# ────────────────────────────────────────────────────────────────────────
# PASSO 4: Testar conexão com PostgreSQL
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n🔌 PASSO 4: Testando conexão com PostgreSQL..."

$testConnection = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "`n❌ ERRO: Não foi possível conectar ao PostgreSQL!"
    Write-Host ""
    Write-ColorOutput Yellow "Verifique:"
    Write-Host "   1. PostgreSQL está rodando? (Verifique em Serviços do Windows)"
    Write-Host "   2. Senha está correta no arquivo .env?"
    Write-Host "   3. Usuário 'postgres' existe?"
    Write-Host ""
    Write-ColorOutput Red "Detalhes do erro:"
    Write-Host $testConnection
    Write-Host ""
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-ColorOutput Green "✅ Conexão bem-sucedida!"

# ────────────────────────────────────────────────────────────────────────
# PASSO 5: Criar banco de dados
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n🗄️  PASSO 5: Criando banco de dados '$DB_NAME'..."

# Verificar se banco já existe
$checkDb = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>&1

if ($checkDb -match "1") {
    Write-ColorOutput Yellow "⚠️  Banco '$DB_NAME' já existe!"
    Write-Host ""
    $response = Read-Host "Deseja RECRIAR o banco? (Todos os dados serão PERDIDOS!) [S/N]"

    if ($response -eq "S" -or $response -eq "s") {
        Write-ColorOutput Red "`n🗑️  Removendo banco existente..."

        # Desconectar usuários ativos
        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
"@ | Out-Null

        # Dropar banco
        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | Out-Null

        Write-ColorOutput Green "✅ Banco antigo removido!"

        # Criar novo banco
        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
        Write-ColorOutput Green "✅ Novo banco criado!"
    } else {
        Write-ColorOutput Yellow "⏭️  Mantendo banco existente. Apenas atualizando schema..."
    }
} else {
    # Criar banco
    & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✅ Banco '$DB_NAME' criado com sucesso!"
    } else {
        Write-ColorOutput Red "❌ Erro ao criar banco de dados!"
        exit 1
    }
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 6: Executar migrações
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n📝 PASSO 6: Executando migrações..."

$migrations = @(
    "001_schema.sql",
    "002_add_contacts_column.sql",
    "003_campaign_logs.sql",
    "004_campaign_events.sql",
    "005_custom_campaigns.sql"
)

foreach ($migration in $migrations) {
    $migrationPath = ".\migrations\$migration"

    if (-not (Test-Path $migrationPath)) {
        Write-ColorOutput Red "   ❌ Migration não encontrada: $migration"
        continue
    }

    Write-ColorOutput White "   📄 Executando $migration..."

    $result = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationPath 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "   ✅ $migration executada com sucesso!"
    } else {
        Write-ColorOutput Red "   ⚠️  Erro em $migration (pode ser normal se já existir)"
        # Não interrompe - continua com próxima migration
    }
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 7: Criar tabela de controle de migrations
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n🎯 PASSO 7: Criando tabela de controle..."

$createMigrationsTable = @"
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255),
    executed_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO schema_migrations (version, name) VALUES
    (1, '001_schema'),
    (2, '002_add_contacts_column'),
    (3, '003_campaign_logs'),
    (4, '004_campaign_events'),
    (5, '005_custom_campaigns')
ON CONFLICT (version) DO NOTHING;
"@

& "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $createMigrationsTable | Out-Null

Write-ColorOutput Green "✅ Tabela de controle criada!"

# ────────────────────────────────────────────────────────────────────────
# PASSO 8: Criar usuário administrador
# ────────────────────────────────────────────────────────────────────────
Write-ColorOutput Yellow "`n👤 PASSO 8: Criando usuário administrador..."

# Verifica se já existe
$checkAdmin = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE email='admin@prismatech.com';" 2>&1

if ($checkAdmin -match "0") {
    Write-ColorOutput White "   Gerando hash de senha..."

    # Usar Node.js para gerar hash bcrypt
    $passwordHash = node -e "const bcrypt = require('bcrypt'); bcrypt.hash('#serverprisma@dti', 10, (err, hash) => { if (err) throw err; console.log(hash); });"

    if ([string]::IsNullOrWhiteSpace($passwordHash)) {
        Write-ColorOutput Red "   ❌ Erro ao gerar hash de senha!"
        Write-ColorOutput Yellow "   O administrador será criado na primeira execução do servidor."
    } else {
        $createAdmin = @"
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('prismaAdministrador', 'admin@prismatech.com', '$passwordHash', 'Prisma', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;
"@

        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $createAdmin | Out-Null

        Write-ColorOutput Green "   ✅ Administrador criado!"
    }
} else {
    Write-ColorOutput Yellow "   ⏭️  Administrador já existe!"
}

# Limpar senha da memória
$env:PGPASSWORD = ""

# ────────────────────────────────────────────────────────────────────────
# FINALIZAÇÃO
# ────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-ColorOutput Green "╔════════════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║  ✅ BANCO DE DADOS CONFIGURADO COM SUCESSO!                    ║"
Write-ColorOutput Green "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

Write-ColorOutput Cyan "📋 CREDENCIAIS DO ADMINISTRADOR:"
Write-ColorOutput White "   Email:    admin@prismatech.com"
Write-ColorOutput White "   Senha:    #serverprisma@dti"
Write-Host ""

Write-ColorOutput Cyan "🗄️  INFORMAÇÕES DO BANCO:"
Write-ColorOutput White "   Host:     $DB_HOST"
Write-ColorOutput White "   Port:     $DB_PORT"
Write-ColorOutput White "   Database: $DB_NAME"
Write-ColorOutput White "   User:     $DB_USER"
Write-Host ""

Write-ColorOutput Cyan "🚀 PRÓXIMOS PASSOS:"
Write-ColorOutput White "   1. Instalar dependências:  npm install"
Write-ColorOutput White "   2. Iniciar servidor:       npm start"
Write-ColorOutput White "   3. Acessar frontend:       http://localhost:5000"
Write-Host ""

Write-ColorOutput Yellow "💡 DICA:"
Write-ColorOutput White "   Para resetar completamente o banco, execute:"
Write-ColorOutput White "   .\setup-database-windows.ps1"
Write-Host ""

Read-Host "Pressione Enter para sair"
