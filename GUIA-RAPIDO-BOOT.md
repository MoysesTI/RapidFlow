# 🚀 RapidFlow v3.0 - Guia Rápido para C:\boot

## ⚡ Instalação Ultra-Rápida

### Opção 1: Script Automático (Recomendado)

```powershell
# 1. Baixe apenas o script de importação
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MoysesTI/RapidFlow/main/IMPORT-TO-BOOT.ps1" -OutFile "$env:TEMP\import-rapidflow.ps1"

# 2. Execute o script
& "$env:TEMP\import-rapidflow.ps1"

# 3. Navegue até o diretório
cd C:\boot\RapidFlow

# 4. Inicie o ambiente
.\start-dev.ps1
```

### Opção 2: Clone Manual

```powershell
# 1. Navegue até C:\boot
cd C:\boot

# 2. Clone o repositório
git clone https://github.com/MoysesTI/RapidFlow.git

# 3. Entre no diretório
cd RapidFlow

# 4. Execute o setup
.\setup-local.ps1

# 5. Inicie o ambiente
.\start-dev.ps1
```

---

## 📁 Estrutura em C:\boot

Após a importação, você terá:

```
C:\boot\RapidFlow\
├── backend/               # Backend Node.js + Express
├── frontend/              # Frontend HTML/CSS/JS
├── setup-local.ps1        # Setup automático
├── start-dev.ps1          # Iniciar desenvolvimento
├── test-local.ps1         # Testes automatizados
├── IMPORT-TO-BOOT.ps1     # Script de importação
└── SETUP-LOCAL-PT.md      # Documentação completa
```

---

## 🎯 Comandos Essenciais

### Setup Inicial (Apenas 1 vez)
```powershell
cd C:\boot\RapidFlow
.\setup-local.ps1
```

**O que faz:**
- ✅ Verifica Node.js, PostgreSQL, npm
- ✅ Cria banco de dados `rapidflow`
- ✅ Executa todas as migrations
- ✅ Instala dependências
- ✅ Cria arquivo `.env`

### Iniciar Desenvolvimento
```powershell
cd C:\boot\RapidFlow
.\start-dev.ps1
```

**O que faz:**
- ✅ Inicia backend (porta 5000)
- ✅ Inicia N8N (porta 5678) - opcional
- ✅ Abre frontend no navegador
- ✅ Monitora serviços em tempo real

### Executar Testes
```powershell
cd C:\boot\RapidFlow
.\test-local.ps1
```

**O que testa:**
- ✅ Health check do backend
- ✅ Conexão com PostgreSQL
- ✅ Autenticação (login)
- ✅ Endpoints da API
- ✅ Webhook N8N

### Parar Todos os Serviços
```powershell
# Pressione Ctrl+C no terminal onde start-dev.ps1 está rodando
# OU execute:
Get-Job | Stop-Job; Get-Job | Remove-Job
```

---

## 🔧 Configuração do Banco de Dados

### Credenciais Padrão
- **Host:** localhost
- **Porta:** 5432
- **Database:** rapidflow
- **Usuário:** postgres
- **Senha:** 242036

### Verificar Banco
```powershell
$env:PGPASSWORD="242036"
psql -U postgres -h localhost -d rapidflow -c "SELECT COUNT(*) FROM users"
```

### Recriar Banco (se necessário)
```powershell
$env:PGPASSWORD="242036"
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS rapidflow"
psql -U postgres -h localhost -c "CREATE DATABASE rapidflow"

cd C:\boot\RapidFlow
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql
psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql
```

---

## 🔑 Configurar APIs

### 1. Editar arquivo .env
```powershell
cd C:\boot\RapidFlow
notepad backend\.env
```

### 2. Adicionar suas chaves

```env
# Evolution API (Obrigatório para enviar mensagens)
DEFAULT_EVOLUTION_ENDPOINT=https://sua-evolution-api.com/message/sendMedia/instance
DEFAULT_EVOLUTION_API_KEY=sua_chave_evolution_aqui

# OpenAI API (Obrigatório para IA)
DEFAULT_OPENAI_API_KEY=sk-proj-sua-chave-openai-aqui
DEFAULT_OPENAI_MODEL=gpt-4o-mini
```

### 3. Reiniciar backend
```powershell
# Pare o backend (Ctrl+C) e inicie novamente:
cd C:\boot\RapidFlow\backend
npm start
```

---

## 🔗 URLs Importantes

Após iniciar com `.\start-dev.ps1`:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | `file:///C:/boot/RapidFlow/frontend/login.html` | Tela de login |
| **Backend API** | http://localhost:5000 | API REST |
| **Health Check** | http://localhost:5000/health | Status do servidor |
| **N8N** | http://localhost:5678 | Automação de workflows |

---

## 👤 Login na Aplicação

**Credenciais padrão:**
- **Email:** admin@prismatech.com
- **Senha:** #serverprisma@dti

---

## 🧪 Testar se está Funcionando

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health"
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-14T...",
  "uptime": 123.456,
  "env": "development",
  "cors": ["http://localhost:3000"],
  "version": "3.0.0"
}
```

### 2. Login
```powershell
$body = @{
    email = "admin@prismatech.com"
    password = "#serverprisma@dti"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $body -ContentType "application/json"

# Ver token
$response.token
```

### 3. Listar Campanhas
```powershell
$headers = @{
    Authorization = "Bearer $($response.token)"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/campaigns" -Headers $headers
```

---

## 📊 Ver Logs do Sistema

### 1. Via PostgreSQL
```sql
-- Conectar
$env:PGPASSWORD="242036"
psql -U postgres -h localhost -d rapidflow

-- Ver logs recentes
SELECT log_level, log_type, message, created_at
FROM system_logs
ORDER BY created_at DESC
LIMIT 20;

-- Ver apenas erros
SELECT * FROM v_recent_errors;

-- Ver resumo de campanhas
SELECT * FROM v_campaigns_summary;
```

### 2. Via Console
Os logs aparecem coloridos no console onde o backend está rodando:
- 🔍 **DEBUG** (Cyan) - Informações de debug
- ✅ **INFO** (Green) - Eventos normais
- ⚠️ **WARN** (Yellow) - Avisos
- ❌ **ERROR** (Red) - Erros
- 💥 **CRITICAL** (Magenta) - Erros graves

---

## 🎨 Importar Workflow N8N

### 1. Instalar N8N (se ainda não instalou)
```powershell
npm install -g n8n
```

### 2. Iniciar N8N
```powershell
n8n start
```

### 3. Acessar N8N
Abra: http://localhost:5678

### 4. Importar Workflow
1. Clique em **"+"** (novo workflow)
2. Clique no menu **"..."** > **"Import from File"**
3. Selecione: `C:\boot\RapidFlow\n8n-workflow-v3.0.json`
4. Configure credenciais do OpenAI
5. Ative o workflow

---

## ❓ Solução de Problemas

### Backend não inicia

**Erro:** `Não foi possível conectar ao banco de dados`

**Solução:**
```powershell
# Verificar se PostgreSQL está rodando
Get-Service -Name postgresql*

# Se não estiver, iniciar:
Start-Service postgresql-x64-15

# Testar conexão:
$env:PGPASSWORD="242036"
psql -U postgres -h localhost -c "SELECT 1"
```

---

### Porta 5000 em uso

**Erro:** `EADDRINUSE: address already in use :::5000`

**Solução:**
```powershell
# Encontrar processo:
Get-NetTCPConnection -LocalPort 5000

# Matar processo:
Stop-Process -Id <PID> -Force

# OU mudar porta no .env:
# PORT=5001
```

---

### Migrations não executam

**Solução:**
```powershell
cd C:\boot\RapidFlow
$env:PGPASSWORD="242036"

# Executar manualmente:
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql
psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql
psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql
```

---

### Erro de CORS

**Erro:** `blocked by CORS policy`

**Solução:**
Edite `backend\.env` e adicione a origem:
```env
CORS_ORIGIN=http://localhost:3000,http://localhost:5500,http://127.0.0.1:3000
```

---

## 🗑️ Desinstalar / Limpar

### Remover tudo
```powershell
# 1. Parar serviços
Get-Job | Stop-Job; Get-Job | Remove-Job

# 2. Dropar banco
$env:PGPASSWORD="242036"
psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS rapidflow"

# 3. Remover diretório
Remove-Item -Path "C:\boot\RapidFlow" -Recurse -Force
```

### Apenas limpar banco
```powershell
$env:PGPASSWORD="242036"
psql -U postgres -h localhost -d rapidflow -c "TRUNCATE TABLE campaigns, campaign_contacts, system_logs, campaign_messages, n8n_events, campaign_analytics RESTART IDENTITY CASCADE"
```

---

## 📚 Documentação Completa

Para mais detalhes, veja:
- **SETUP-LOCAL-PT.md** - Guia completo de configuração
- **CHANGELOG.md** - Mudanças da v3.0
- **README.md** - Documentação geral do projeto

---

## 🆘 Suporte

- **GitHub:** https://github.com/MoysesTI/RapidFlow
- **Issues:** https://github.com/MoysesTI/RapidFlow/issues

---

## ✅ Checklist de Configuração

Marque conforme completa:

- [ ] Pré-requisitos instalados (Node.js, PostgreSQL, Git)
- [ ] Repositório clonado em `C:\boot\RapidFlow`
- [ ] Setup executado (`.\setup-local.ps1`)
- [ ] Banco de dados criado e migrations executadas
- [ ] Arquivo `.env` configurado com suas chaves de API
- [ ] Backend iniciado com sucesso
- [ ] Frontend acessível
- [ ] Login funcionando
- [ ] N8N instalado e workflow importado (opcional)
- [ ] Testes passando (`.\test-local.ps1`)

---

**Sistema pronto para uso em C:\boot! 🎉**
