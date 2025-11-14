# ═══════════════════════════════════════════════════════════════════════
# RAPIDFLOW - INSTALAÇÃO E CONFIGURAÇÃO COMPLETA (Windows)
# ═══════════════════════════════════════════════════════════════════════
# Este script irá:
#   1. Clonar/atualizar o repositório
#   2. Configurar o arquivo .env automaticamente
#   3. Instalar dependências
#   4. Configurar banco de dados PostgreSQL 16
#   5. Executar migrações
#   6. Criar usuário administrador
# ═══════════════════════════════════════════════════════════════════════

# Configurações do usuário
$REPO_URL = "https://github.com/MoysesTI/RapidFlow.git"
$INSTALL_PATH = "C:\projetos\RapidFlow"
$DB_PASSWORD = "242036"
$DB_USER = "postgres"
$DB_HOST = "localhost"
$DB_PORT = "5432"
$DB_NAME = "rapidflow"

# ────────────────────────────────────────────────────────────────────────
# FUNÇÕES AUXILIARES
# ────────────────────────────────────────────────────────────────────────
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Step($Message) {
    Write-Host ""
    Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════════════════"
    Write-ColorOutput Cyan $Message
    Write-ColorOutput Cyan "═══════════════════════════════════════════════════════════════════════"
    Write-Host ""
}

function Write-Success($Message) {
    Write-ColorOutput Green "✅ $Message"
}

function Write-Info($Message) {
    Write-ColorOutput Yellow "ℹ️  $Message"
}

function Write-Error($Message) {
    Write-ColorOutput Red "❌ $Message"
}

# ────────────────────────────────────────────────────────────────────────
# BANNER
# ────────────────────────────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-ColorOutput Cyan "╔═══════════════════════════════════════════════════════════════════════╗"
Write-ColorOutput Cyan "║                                                                       ║"
Write-ColorOutput Cyan "║              RAPIDFLOW - INSTALAÇÃO COMPLETA v3.0                     ║"
Write-ColorOutput Cyan "║                                                                       ║"
Write-ColorOutput Cyan "╚═══════════════════════════════════════════════════════════════════════╝"
Write-Host ""

Write-ColorOutput White "📋 CONFIGURAÇÕES DA INSTALAÇÃO:"
Write-ColorOutput White "   Diretório:    $INSTALL_PATH"
Write-ColorOutput White "   PostgreSQL:   v16"
Write-ColorOutput White "   Banco:        $DB_NAME"
Write-ColorOutput White "   Usuário DB:   $DB_USER"
Write-ColorOutput White "   Host DB:      $DB_HOST:$DB_PORT"
Write-Host ""

$response = Read-Host "Deseja continuar com a instalação? [S/N]"
if ($response -ne "S" -and $response -ne "s") {
    Write-Info "Instalação cancelada pelo usuário."
    exit 0
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 1: Verificar Node.js
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 1: Verificando Node.js"

try {
    $nodeVersion = node --version
    Write-Success "Node.js instalado: $nodeVersion"
} catch {
    Write-Error "Node.js não encontrado!"
    Write-Info "Por favor, instale o Node.js (v18 ou superior) de https://nodejs.org/"
    Read-Host "Pressione Enter para sair"
    exit 1
}

try {
    $npmVersion = npm --version
    Write-Success "npm instalado: v$npmVersion"
} catch {
    Write-Error "npm não encontrado!"
    exit 1
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 2: Verificar Git
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 2: Verificando Git"

try {
    $gitVersion = git --version
    Write-Success "Git instalado: $gitVersion"
} catch {
    Write-Error "Git não encontrado!"
    Write-Info "Por favor, instale o Git de https://git-scm.com/download/win"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 3: Clonar ou atualizar repositório
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 3: Obtendo código-fonte"

# Criar diretório pai se não existir
$parentDir = Split-Path -Parent $INSTALL_PATH
if (-not (Test-Path $parentDir)) {
    Write-Info "Criando diretório $parentDir..."
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null
    Write-Success "Diretório criado!"
}

if (Test-Path $INSTALL_PATH) {
    Write-Info "Diretório $INSTALL_PATH já existe."
    $updateResponse = Read-Host "Deseja atualizar (pull) o código existente? [S/N]"

    if ($updateResponse -eq "S" -or $updateResponse -eq "s") {
        Write-Info "Atualizando repositório..."
        Set-Location $INSTALL_PATH

        try {
            git fetch origin
            git pull origin main
            Write-Success "Código atualizado com sucesso!"
        } catch {
            Write-Error "Erro ao atualizar repositório: $_"
            Write-Info "Continuando com código existente..."
        }
    } else {
        Write-Info "Usando código existente sem atualizar."
    }
} else {
    Write-Info "Clonando repositório de $REPO_URL..."

    try {
        git clone $REPO_URL $INSTALL_PATH
        Write-Success "Repositório clonado com sucesso!"
        Set-Location $INSTALL_PATH
    } catch {
        Write-Error "Erro ao clonar repositório: $_"
        Read-Host "Pressione Enter para sair"
        exit 1
    }
}

# Ir para o diretório backend
$backendPath = Join-Path $INSTALL_PATH "backend"
if (-not (Test-Path $backendPath)) {
    Write-Error "Diretório backend não encontrado em $backendPath"
    Read-Host "Pressione Enter para sair"
    exit 1
}

Set-Location $backendPath
Write-Success "Localizado em: $backendPath"

# ────────────────────────────────────────────────────────────────────────
# PASSO 4: Configurar arquivo .env
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 4: Configurando arquivo .env"

$envPath = Join-Path $backendPath ".env"

# Criar arquivo .env
$envContent = @"
# ═══════════════════════════════════════════════════════════════
# RAPIDFLOW - ENVIRONMENT VARIABLES (Gerado automaticamente)
# ═══════════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────────────
# SERVIDOR
# ────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000
BACKEND_URL=http://localhost:5000

# ────────────────────────────────────────────────────────────────
# BANCO DE DADOS (PostgreSQL 16)
# ────────────────────────────────────────────────────────────────
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=false

# ────────────────────────────────────────────────────────────────
# SEGURANÇA
# ────────────────────────────────────────────────────────────────
JWT_SECRET=$(New-Guid).ToString()
JWT_EXPIRES_IN=24h

# ────────────────────────────────────────────────────────────────
# CORS (Domínios permitidos)
# ────────────────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500

# ────────────────────────────────────────────────────────────────
# ADMIN PADRÃO (Primeiro usuário)
# ────────────────────────────────────────────────────────────────
ADMIN_USERNAME=prismaAdministrador
ADMIN_PASSWORD=#serverprisma@dti

# ────────────────────────────────────────────────────────────────
# CONFIGURAÇÕES PADRÃO (Opcional)
# ────────────────────────────────────────────────────────────────
DEFAULT_WEBHOOK_URL=https://webhook.automacaoklyon.com/webhook/prisma-campaign
DEFAULT_EVOLUTION_ENDPOINT=https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem
DEFAULT_EVOLUTION_API_KEY=YOUR_EVOLUTION_KEY_HERE
DEFAULT_OPENAI_API_KEY=sk-your-openai-key-here
"@

Set-Content -Path $envPath -Value $envContent -Encoding UTF8
Write-Success "Arquivo .env criado e configurado!"
Write-Info "Localização: $envPath"

# ────────────────────────────────────────────────────────────────────────
# PASSO 5: Instalar dependências
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 5: Instalando dependências npm"

Write-Info "Executando npm install (isso pode demorar alguns minutos)..."

try {
    npm install
    Write-Success "Dependências instaladas com sucesso!"
} catch {
    Write-Error "Erro ao instalar dependências: $_"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 6: Localizar PostgreSQL 16
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 6: Localizando PostgreSQL 16"

$PG_PATHS = @(
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin"
)

$PSQL_PATH = $null

foreach ($path in $PG_PATHS) {
    if (Test-Path "$path\psql.exe") {
        $PSQL_PATH = $path
        break
    }
}

if (-not $PSQL_PATH) {
    Write-Error "PostgreSQL não encontrado!"
    Write-Info "Por favor, certifique-se de que o PostgreSQL 16 está instalado."
    Write-Info "Caminhos verificados:"
    foreach ($path in $PG_PATHS) {
        Write-Info "   - $path"
    }
    Read-Host "Pressione Enter para sair"
    exit 1
}

Write-Success "PostgreSQL encontrado em: $PSQL_PATH"

# Definir variável de ambiente para senha
$env:PGPASSWORD = $DB_PASSWORD

# ────────────────────────────────────────────────────────────────────────
# PASSO 7: Testar conexão com PostgreSQL
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 7: Testando conexão com PostgreSQL"

try {
    $testConnection = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT version();" 2>&1

    if ($LASTEXITCODE -ne 0) {
        throw "Falha na conexão"
    }

    Write-Success "Conexão com PostgreSQL estabelecida!"
} catch {
    Write-Error "Não foi possível conectar ao PostgreSQL!"
    Write-Info "Verifique:"
    Write-Info "   1. PostgreSQL está rodando? (Services.msc → postgresql-x64-16)"
    Write-Info "   2. Senha '$DB_PASSWORD' está correta?"
    Write-Info "   3. Usuário '$DB_USER' existe?"
    Write-Host ""
    Write-Error "Detalhes: $_"
    Read-Host "Pressione Enter para sair"
    exit 1
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 8: Criar banco de dados
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 8: Criando banco de dados '$DB_NAME'"

# Verificar se banco já existe
$checkDb = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>&1

if ($checkDb -match "1") {
    Write-Info "Banco '$DB_NAME' já existe!"
    $recreateResponse = Read-Host "Deseja RECRIAR o banco? (Todos os dados serão PERDIDOS!) [S/N]"

    if ($recreateResponse -eq "S" -or $recreateResponse -eq "s") {
        Write-Info "Desconectando usuários ativos..."

        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c @"
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
"@ | Out-Null

        Write-Info "Removendo banco existente..."
        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>&1 | Out-Null

        Write-Info "Criando novo banco..."
        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null
        Write-Success "Banco recriado com sucesso!"
    } else {
        Write-Info "Mantendo banco existente. Apenas atualizando schema..."
    }
} else {
    Write-Info "Criando banco de dados..."
    & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>&1 | Out-Null

    if ($LASTEXITCODE -eq 0) {
        Write-Success "Banco '$DB_NAME' criado com sucesso!"
    } else {
        Write-Error "Erro ao criar banco de dados!"
        exit 1
    }
}

# ────────────────────────────────────────────────────────────────────────
# PASSO 9: Executar migrações
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 9: Executando migrações do banco de dados"

$migrations = @(
    "001_schema.sql",
    "002_add_contacts_column.sql",
    "003_campaign_logs.sql",
    "004_campaign_events.sql",
    "005_custom_campaigns.sql"
)

foreach ($migration in $migrations) {
    $migrationPath = Join-Path $backendPath "migrations\$migration"

    if (-not (Test-Path $migrationPath)) {
        Write-Info "   ⏭️  Migration não encontrada: $migration"
        continue
    }

    Write-Info "   📄 Executando $migration..."

    $result = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $migrationPath 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Success "   ✅ $migration executada!"
    } else {
        Write-Info "   ⚠️  $migration (pode ser normal se já existir)"
    }
}

Write-Success "Migrações concluídas!"

# ────────────────────────────────────────────────────────────────────────
# PASSO 10: Criar tabela de controle de migrations
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 10: Criando tabela de controle"

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
Write-Success "Tabela de controle criada!"

# ────────────────────────────────────────────────────────────────────────
# PASSO 11: Criar usuário administrador
# ────────────────────────────────────────────────────────────────────────
Write-Step "PASSO 11: Criando usuário administrador"

# Verificar se já existe
$checkAdmin = & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users WHERE email='admin@prismatech.com';" 2>&1

if ($checkAdmin -match "0") {
    Write-Info "Gerando hash de senha..."

    try {
        # Criar um script temporário Node.js para gerar o hash
        $hashScript = @"
const bcrypt = require('bcrypt');
bcrypt.hash('#serverprisma@dti', 10)
    .then(hash => console.log(hash))
    .catch(err => { console.error(err); process.exit(1); });
"@

        $tempScriptPath = Join-Path $env:TEMP "generate-hash.js"
        Set-Content -Path $tempScriptPath -Value $hashScript

        $passwordHash = node $tempScriptPath
        Remove-Item $tempScriptPath -Force

        if ([string]::IsNullOrWhiteSpace($passwordHash)) {
            throw "Hash vazio"
        }

        $createAdmin = @"
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('prismaAdministrador', 'admin@prismatech.com', '$passwordHash', 'Prisma', 'Administrator', 'admin')
ON CONFLICT (email) DO NOTHING;
"@

        & "$PSQL_PATH\psql.exe" -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c $createAdmin | Out-Null

        Write-Success "Administrador criado com sucesso!"
    } catch {
        Write-Info "Não foi possível criar hash. Administrador será criado na primeira execução."
    }
} else {
    Write-Info "Administrador já existe!"
}

# Limpar senha da memória
$env:PGPASSWORD = ""

# ────────────────────────────────────────────────────────────────────────
# FINALIZAÇÃO
# ────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host ""
Write-ColorOutput Green "╔═══════════════════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║                                                                       ║"
Write-ColorOutput Green "║        ✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!                           ║"
Write-ColorOutput Green "║                                                                       ║"
Write-ColorOutput Green "╚═══════════════════════════════════════════════════════════════════════╝"
Write-Host ""

Write-ColorOutput Cyan "📁 LOCALIZAÇÃO DO PROJETO:"
Write-ColorOutput White "   $backendPath"
Write-Host ""

Write-ColorOutput Cyan "🗄️  INFORMAÇÕES DO BANCO DE DADOS:"
Write-ColorOutput White "   Host:     $DB_HOST"
Write-ColorOutput White "   Port:     $DB_PORT"
Write-ColorOutput White "   Database: $DB_NAME"
Write-ColorOutput White "   User:     $DB_USER"
Write-ColorOutput White "   Password: $DB_PASSWORD"
Write-Host ""

Write-ColorOutput Cyan "👤 CREDENCIAIS DO ADMINISTRADOR:"
Write-ColorOutput White "   Email:    admin@prismatech.com"
Write-ColorOutput White "   Senha:    #serverprisma@dti"
Write-Host ""

Write-ColorOutput Cyan "🚀 PRÓXIMOS PASSOS:"
Write-ColorOutput White "   1. Ir para o diretório:"
Write-ColorOutput Yellow "      cd $backendPath"
Write-Host ""
Write-ColorOutput White "   2. Iniciar o servidor:"
Write-ColorOutput Yellow "      npm start"
Write-Host ""
Write-ColorOutput White "   3. Acessar o sistema:"
Write-ColorOutput Yellow "      http://localhost:5000"
Write-Host ""

Write-ColorOutput Cyan "💡 COMANDOS ÚTEIS:"
Write-ColorOutput White "   • Resetar banco:           npm run reset-db"
Write-ColorOutput White "   • Modo desenvolvimento:    npm run dev"
Write-ColorOutput White "   • Reconfigurar tudo:       .\setup-completo-windows.ps1"
Write-Host ""

Write-ColorOutput Cyan "📚 ESTRUTURA DE DIRETÓRIOS:"
Write-ColorOutput White "   $INSTALL_PATH\"
Write-ColorOutput White "   ├── backend\          (Servidor Node.js + API)"
Write-ColorOutput White "   ├── frontend\         (Interface web)"
Write-ColorOutput White "   └── docs\             (Documentação)"
Write-Host ""

$startNow = Read-Host "Deseja iniciar o servidor agora? [S/N]"
if ($startNow -eq "S" -or $startNow -eq "s") {
    Write-Host ""
    Write-ColorOutput Cyan "🚀 Iniciando servidor RapidFlow..."
    Write-ColorOutput Yellow "   (Pressione Ctrl+C para parar)"
    Write-Host ""
    Start-Sleep -Seconds 2

    Set-Location $backendPath
    npm start
} else {
    Write-Host ""
    Write-ColorOutput Green "✨ Instalação concluída! Até logo!"
    Write-Host ""
}
