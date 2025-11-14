# 🚀 RapidFlow v3.0 - Guia de Configuração Local

## 📋 Índice
- [Visão Geral](#-visão-geral)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Rápida](#-instalação-rápida)
- [Configuração Manual](#-configuração-manual)
- [Integrações](#-integrações)
- [Testes](#-testes)
- [Solução de Problemas](#-solução-de-problemas)

---

## 🎯 Visão Geral

**RapidFlow v3.0** é um sistema completo de automação para envio de mensagens em massa via WhatsApp com personalização via IA.

### Novidades da v3.0:
- ✅ Sistema robusto de logs e monitoramento
- ✅ Tratamento de erros centralizado
- ✅ Analytics em tempo real
- ✅ Circuit breaker e retry automático
- ✅ Integração aprimorada com N8N
- ✅ Suporte a múltiplas tabelas de rastreamento

---

## 💻 Pré-requisitos

### Obrigatórios:
1. **Node.js** >= 18.0.0
   - Download: https://nodejs.org
   - Verificar: `node --version`

2. **PostgreSQL** >= 15.0
   - Download: https://www.postgresql.org/download/windows/
   - Verificar: `psql --version`
   - **Senha padrão:** `242036`

3. **npm** (vem com Node.js)
   - Verificar: `npm --version`

### Opcionais:
4. **N8N** (para automação de workflows)
   ```powershell
   npm install -g n8n
   ```

5. **Git** (para controle de versão)
   - Download: https://git-scm.com/

---

## ⚡ Instalação Rápida

### Opção 1: Usando PowerShell (Recomendado)

```powershell
# 1. Clone o repositório
git clone https://github.com/MoysesTI/RapidFlow.git
cd RapidFlow

# 2. Execute o setup automático
.\setup-local.ps1

# 3. Inicie o ambiente de desenvolvimento
.\start-dev.ps1
```

### Opção 2: Instalação Manual

Veja a seção [Configuração Manual](#-configuração-manual) abaixo.

---

## 🔧 Configuração Manual

### 1. Configurar Banco de Dados

```powershell
# Conectar ao PostgreSQL
$env:PGPASSWORD="242036"
psql -U postgres -h localhost

# Criar banco de dados
CREATE DATABASE rapidflow;

# Sair do psql
\q

# Executar migrations
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql
psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql
```

### 2. Configurar Backend

```powershell
cd backend

# Instalar dependências
npm install

# Copiar arquivo de configuração
Copy-Item .env.local .env

# Editar configurações (se necessário)
notepad .env
```

### 3. Configurar Variáveis de Ambiente

Edite o arquivo `backend/.env`:

```env
# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=242036
DB_SSL=false

# Segurança
JWT_SECRET=rapidflow_local_secret_key_development_2025_ultra_secure_token
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Evolution API (CONFIGURAR COM SUAS CREDENCIAIS)
DEFAULT_EVOLUTION_ENDPOINT=https://sua-evolution-api.com/message/sendMedia/instance
DEFAULT_EVOLUTION_API_KEY=sua_chave_evolution

# OpenAI API (CONFIGURAR COM SUA CHAVE)
DEFAULT_OPENAI_API_KEY=sk-sua-chave-openai
DEFAULT_OPENAI_MODEL=gpt-4o-mini

# N8N Webhook
DEFAULT_WEBHOOK_URL=http://localhost:5678/webhook/prisma
```

### 4. Iniciar Serviços

#### Backend:
```powershell
cd backend
npm start
```

#### N8N (opcional):
```powershell
n8n start
```

#### Frontend:
- Abra `frontend/login.html` no navegador
- Ou use um servidor HTTP:
  ```powershell
  cd frontend
  npx http-server -p 3000
  ```

---

## 🔗 Integrações

### N8N - Importar Workflow

1. Acesse: http://localhost:5678
2. Vá em: **Workflows > Importar Workflow**
3. Selecione: `n8n-workflow-v3.0.json`
4. Configure as credenciais do OpenAI
5. Ative o workflow

### Evolution API

1. Obtenha suas credenciais em: https://evolution-api.com (ou sua instância)
2. Configure no arquivo `.env`:
   ```env
   DEFAULT_EVOLUTION_ENDPOINT=https://sua-api.com/message/sendMedia/instance
   DEFAULT_EVOLUTION_API_KEY=sua_chave_aqui
   ```

### OpenAI

1. Crie uma conta em: https://platform.openai.com
2. Gere uma API Key
3. Configure no `.env`:
   ```env
   DEFAULT_OPENAI_API_KEY=sk-sua-chave-aqui
   DEFAULT_OPENAI_MODEL=gpt-4o-mini
   ```

---

## 🧪 Testes

### Executar Suite de Testes

```powershell
# Todos os testes
.\test-local.ps1

# Apenas health check
.\test-local.ps1 -TestType health

# Apenas autenticação
.\test-local.ps1 -TestType auth

# Apenas banco de dados
.\test-local.ps1 -TestType database
```

### Teste Manual - API

```powershell
# Health Check
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Login
$loginBody = @{
    email = "admin@prismatech.com"
    password = "#serverprisma@dti"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"

# Listar Campanhas (com token)
$headers = @{
    Authorization = "Bearer $($response.token)"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/campaigns" -Headers $headers
```

### Teste Manual - N8N Webhook

```powershell
$testPayload = @{
    test = $true
    contacts = @()
    config = @{
        evolutionEndpoint = "https://test.com"
        evolutionApiKey = "test-key"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5678/webhook/prisma" -Method POST -Body $testPayload -ContentType "application/json"
```

---

## 🔍 Verificação de Logs

### Ver Logs do Sistema (Banco de Dados)

```sql
-- Conectar ao PostgreSQL
psql -U postgres -h localhost -d rapidflow

-- Ver logs recentes
SELECT
    log_level,
    log_type,
    message,
    created_at
FROM system_logs
ORDER BY created_at DESC
LIMIT 50;

-- Ver apenas erros
SELECT * FROM v_recent_errors;

-- Ver analytics de campanhas
SELECT * FROM v_campaigns_summary;

-- Ver performance de webhooks
SELECT * FROM v_webhook_performance;
```

### Monitorar Logs em Tempo Real

O servidor exibe logs coloridos no console:
- 🔍 **DEBUG** (Cyan) - Informações de desenvolvimento
- ✅ **INFO** (Green) - Eventos normais
- ⚠️ **WARN** (Yellow) - Situações suspeitas
- ❌ **ERROR** (Red) - Erros recuperáveis
- 💥 **CRITICAL** (Magenta) - Erros graves

---

## ❓ Solução de Problemas

### Problema: Erro ao conectar ao PostgreSQL

**Sintoma:**
```
❌ Não foi possível conectar ao banco de dados
```

**Solução:**
1. Verifique se o PostgreSQL está rodando:
   ```powershell
   Get-Service -Name postgresql*
   ```

2. Se não estiver rodando:
   ```powershell
   Start-Service postgresql-x64-15
   ```

3. Verifique a senha:
   ```powershell
   $env:PGPASSWORD="242036"
   psql -U postgres -h localhost -d rapidflow -c "SELECT 1"
   ```

---

### Problema: Porta 5000 já em uso

**Sintoma:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solução:**
1. Identificar processo usando a porta:
   ```powershell
   Get-NetTCPConnection -LocalPort 5000 | Select-Object OwningProcess
   ```

2. Matar o processo:
   ```powershell
   Stop-Process -Id <PID> -Force
   ```

3. Ou altere a porta no `.env`:
   ```env
   PORT=5001
   ```

---

### Problema: N8N não inicia

**Sintoma:**
```
n8n: command not found
```

**Solução:**
```powershell
# Instalar N8N globalmente
npm install -g n8n

# Ou executar localmente
npx n8n start
```

---

### Problema: Erro de CORS

**Sintoma:**
```
Access to fetch at 'http://localhost:5000/api/auth/login' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Solução:**
Adicione a origem no arquivo `.env`:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5500,http://127.0.0.1:3000
```

---

### Problema: Migrations não executam

**Sintoma:**
```
❌ Erro ao configurar banco
```

**Solução:**
```powershell
# Executar migrations manualmente
$env:PGPASSWORD="242036"

# Schema base
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql

# Sistema de logs
psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql

# Coluna de contatos
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql

# Verificar tabelas criadas
psql -U postgres -h localhost -d rapidflow -c "\dt"
```

---

## 📁 Estrutura de Diretórios

```
RapidFlow/
├── backend/
│   ├── src/
│   │   ├── config/           # Configurações do banco
│   │   ├── controllers/      # Lógica de negócio
│   │   ├── middleware/       # Autenticação, etc
│   │   ├── routes/           # Rotas da API
│   │   ├── utils/            # Logger e ErrorHandler
│   │   └── server.js         # Servidor principal
│   ├── migrations/           # SQL migrations
│   ├── .env                  # Configurações (NÃO COMMITAR)
│   ├── .env.local            # Template local
│   └── package.json
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html            # Dashboard
│   └── login.html            # Tela de login
├── setup-local.ps1           # Script de setup
├── start-dev.ps1             # Script para iniciar
├── test-local.ps1            # Script de testes
└── n8n-workflow-v3.0.json    # Workflow N8N
```

---

## 🔐 Credenciais Padrão

### Aplicação:
- **Email:** admin@prismatech.com
- **Senha:** #serverprisma@dti

### Banco de Dados:
- **Usuário:** postgres
- **Senha:** 242036
- **Database:** rapidflow
- **Host:** localhost
- **Porta:** 5432

---

## 📞 Suporte

- **GitHub:** https://github.com/MoysesTI/RapidFlow
- **Issues:** https://github.com/MoysesTI/RapidFlow/issues
- **Email:** Contate o desenvolvedor através do GitHub

---

## 🎉 Próximos Passos

Após a configuração:

1. ✅ Acesse: http://localhost:3000/login.html
2. ✅ Faça login com as credenciais padrão
3. ✅ Configure suas chaves de API (Evolution + OpenAI)
4. ✅ Importe e ative o workflow N8N
5. ✅ Crie sua primeira campanha de teste!

---

**Desenvolvido com ❤️ por Moyses**
