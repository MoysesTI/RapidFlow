# 🚀 GUIA COMPLETO - TESTE LOCAL DO RAPIDFLOW

## 📋 PRÉ-REQUISITOS

Certifique-se de ter instalado:

- ✅ **Node.js** (v18 ou superior) - https://nodejs.org
- ✅ **PostgreSQL** (v12 ou superior) - https://www.postgresql.org/download/
- ✅ **Git** - https://git-scm.com/downloads
- ✅ **Editor de código** (VS Code recomendado)

---

## 📥 PASSO 1: CLONAR O PROJETO

Abra o terminal/PowerShell e execute:

```bash
# Navegar para a pasta onde quer o projeto
cd C:\projetos

# Clonar o repositório
git clone https://github.com/MoysesTI/RapidFlow.git

# Entrar na pasta do projeto
cd RapidFlow

# Mudar para a branch com as melhorias
git checkout claude/project-working-status-011CV5qRmbpkTYT9hCCQMZbH
```

---

## 🗄️ PASSO 2: CONFIGURAR POSTGRESQL

### 2.1 Criar o Banco de Dados

Abra o **pgAdmin** ou execute no terminal:

```sql
-- Conectar ao PostgreSQL
psql -U postgres

-- Criar banco de dados
CREATE DATABASE rapidflow;

-- Criar usuário (opcional, pode usar postgres mesmo)
CREATE USER rapidflow_user WITH PASSWORD 'senha123';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE rapidflow TO rapidflow_user;

-- Sair
\q
```

### 2.2 Alternativa: Usar pgAdmin

1. Abrir **pgAdmin**
2. Botão direito em **Databases** → **Create** → **Database**
3. Nome: `rapidflow`
4. Owner: `postgres` (ou criar novo usuário)
5. Salvar

---

## ⚙️ PASSO 3: CONFIGURAR O BACKEND

### 3.1 Instalar Dependências

```bash
# Entrar na pasta backend
cd backend

# Instalar dependências
npm install
```

### 3.2 Criar Arquivo .env

Criar arquivo `.env` na pasta `backend/`:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Ou criar manualmente pelo explorador
```

### 3.3 Configurar Variáveis de Ambiente

Editar o arquivo `backend/.env` e adicionar:

```env
# =====================================================
# BANCO DE DADOS
# =====================================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres
DB_SSL=false

# =====================================================
# SEGURANÇA
# =====================================================
JWT_SECRET=minha_chave_secreta_super_segura_12345678901234567890
JWT_EXPIRES_IN=24h

# =====================================================
# SERVIDOR
# =====================================================
PORT=5000
NODE_ENV=development
BACKEND_URL=http://localhost:5000

# =====================================================
# CORS
# =====================================================
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# =====================================================
# N8N E EVOLUTION API (OPCIONAL PARA TESTE)
# =====================================================
DEFAULT_WEBHOOK_URL=https://webhook.automacaoklyon.com/webhook/prisma-campaign
DEFAULT_EVOLUTION_ENDPOINT=https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem
DEFAULT_EVOLUTION_API_KEY=FBAF0775D817-45C7-9ACC-F7720DDAA9E2
DEFAULT_OPENAI_API_KEY=
```

**⚠️ IMPORTANTE:** Substitua `sua_senha_do_postgres` pela senha do seu PostgreSQL!

---

## 🚀 PASSO 4: RODAR O BACKEND

```bash
# Ainda na pasta backend
npm start
```

**Você deve ver:**

```
🔧 Verificando banco de dados...
📁 Encontradas 3 migrations
📊 Executando migration: 001_schema
✅ Migration 001_schema executada com sucesso!
📊 Executando migration: 002_campaign_logs
✅ Migration 002_campaign_logs executada com sucesso!
👤 Criando usuário administrador...
✅ Administrador criado!
   Email: admin@prismatech.com
   Senha: #serverprisma@dti
✅ Banco de dados configurado e atualizado!
✅ PostgreSQL conectado com sucesso
🌐 Servidor rodando em: http://localhost:5000
```

✅ **Backend funcionando!**

---

## 🎨 PASSO 5: CONFIGURAR O FRONTEND

### 5.1 Atualizar URL da API (se necessário)

Abrir arquivo `frontend/js/api.js` e verificar linha 5:

```javascript
const API_URL = 'http://localhost:5000/api';  // ← Deve estar assim para teste local
```

**Se estiver apontando para produção:**

```javascript
// ANTES (produção)
const API_URL = 'https://rapidflow-backend.onrender.com/api';

// DEPOIS (local)
const API_URL = 'http://localhost:5000/api';
```

### 5.2 Servir o Frontend

**Opção 1: Live Server (VS Code)**

1. Instalar extensão **Live Server** no VS Code
2. Botão direito em `frontend/index.html`
3. Selecionar **Open with Live Server**
4. Abre automaticamente em `http://127.0.0.1:5500`

**Opção 2: http-server (Node.js)**

```bash
# Instalar http-server globalmente
npm install -g http-server

# Na pasta raiz do projeto
http-server frontend -p 3000

# Acessar: http://localhost:3000
```

**Opção 3: Python SimpleHTTPServer**

```bash
# Na pasta frontend
cd frontend

# Python 3
python -m http.server 3000

# Acessar: http://localhost:3000
```

---

## 🧪 PASSO 6: TESTAR O SISTEMA

### 6.1 Fazer Login

1. Abrir navegador em: `http://localhost:3000/login.html`
2. Usar credenciais padrão:
   - **Email:** `admin@prismatech.com`
   - **Senha:** `#serverprisma@dti`
3. Clicar em **Entrar**

✅ Se der certo, vai redirecionar para o dashboard!

---

### 6.2 Testar Configurações

**No Dashboard:**

1. **Verificar se campos estão preenchidos**
   - Webhook n8n
   - Evolution API Endpoint
   - Evolution API Key

2. **Testar as novas funcionalidades:**
   - ☑️ Toggle "Usar IA" (marcar/desmarcar)
   - 🔄 Campo "Tentativas em Caso de Erro" (mudar valor)

---

### 6.3 Testar Upload de Contatos

**Criar arquivo de teste `contatos_teste.csv`:**

```csv
nome,telefone
João Silva,11999999999
Maria Santos,11988888888
Pedro Oliveira,11977777777
Ana Costa,11966666666
Carlos Souza,11955555555
```

**No Dashboard:**

1. Clicar em **"Carregar Contatos"**
2. Selecionar `contatos_teste.csv`
3. Ver contatos carregados na interface

✅ **Total: 5 contatos**

---

### 6.4 Testar Conexão do Webhook (OPCIONAL)

**Se você tem n8n configurado:**

1. Preencher URL do webhook n8n
2. Clicar em **"Testar Conexão"**
3. Ver resultado no log

**Se NÃO tem n8n:**
- Pular este passo por enquanto
- Pode testar sem enviar mensagens reais

---

### 6.5 Testar Criação de Campanha

**IMPORTANTE:** Isso vai criar a campanha mas NÃO vai enviar mensagens (sem n8n ativo)

1. Preencher configurações:
   ```
   Webhook: http://localhost:5678/webhook/test (qualquer URL)
   Evolution Endpoint: http://localhost:8080/message/sendMedia/test
   API Key: test123
   Imagem: https://i.imgur.com/example.jpg
   Delay Min: 10
   Delay Max: 20
   Prompt: Olá {{nome}}! Teste de mensagem.
   ```

2. **Marcar/Desmarcar "Usar IA"** (testar ambos)

3. **Ajustar "Tentativas"** para 2

4. Clicar em **"Iniciar Campanha"**

**O que deve acontecer:**

✅ Log: "🚀 Iniciando campanha..."
✅ Log: "✅ Campanha criada!"
✅ Log: "📤 Enviando para processamento..."
✅ Status: "Em Execução"
✅ Polling inicia automaticamente

---

### 6.6 Testar Polling de Progresso

**O que deve acontecer a cada 5 segundos:**

- Console do navegador mostra requisições
- Dashboard NÃO atualiza (pois n8n não está enviando callbacks)

**Para simular callback manualmente:**

```bash
# Usar Postman ou curl

# 1. Atualizar status de mensagem
curl -X POST http://localhost:5000/api/campaigns/CAMP-123/update-status \
  -H "Content-Type: application/json" \
  -d '{
    "contactName": "João Silva",
    "phone": "5511999999999",
    "status": "sent",
    "messageText": "Olá João! Como vai?"
  }'

# 2. Finalizar campanha
curl -X POST http://localhost:5000/api/campaigns/CAMP-123/complete \
  -H "Content-Type: application/json" \
  -d '{
    "totalSent": 4,
    "totalErrors": 1
  }'
```

---

### 6.7 Testar Visualização de Logs

**Se você enviou callbacks manualmente:**

1. Ver card "Mensagens Enviadas" aparecer
2. Testar filtros:
   - Clicar em **"Todas"**
   - Clicar em **"✅ Enviadas"**
   - Clicar em **"❌ Erros"**

3. Ver detalhes de cada mensagem:
   - Nome do contato
   - Telefone
   - Mensagem enviada
   - Timestamp

---

## 🔍 PASSO 7: VERIFICAR BANCO DE DADOS

### 7.1 Ver Campanhas Criadas

```sql
-- Conectar ao banco
psql -U postgres -d rapidflow

-- Ver campanhas
SELECT id, campaign_id, name, status, total_contacts, sent_count, error_count, success_rate
FROM campaigns
ORDER BY created_at DESC;

-- Ver logs de mensagens
SELECT id, contact_name, phone, status, sent_at
FROM campaign_message_logs
ORDER BY created_at DESC
LIMIT 10;

-- Ver migrations executadas
SELECT * FROM schema_migrations;
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Cannot connect to database"

**Solução:**

1. Verificar se PostgreSQL está rodando
   ```bash
   # Windows
   services.msc → Procurar "PostgreSQL" → Iniciar
   ```

2. Verificar credenciais no `.env`
   - `DB_USER` correto?
   - `DB_PASSWORD` correto?
   - `DB_NAME=rapidflow` existe?

3. Testar conexão manualmente:
   ```bash
   psql -U postgres -d rapidflow
   ```

---

### Erro: "Port 5000 already in use"

**Solução:**

```bash
# Ver o que está usando a porta
netstat -ano | findstr :5000

# Matar o processo (Windows)
taskkill /PID <numero_do_pid> /F

# Ou mudar a porta no .env
PORT=5001
```

---

### Erro: "CORS policy"

**Solução:**

Verificar se `CORS_ORIGIN` no `.env` inclui a URL do frontend:

```env
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500
```

---

### Frontend não carrega

**Solução:**

1. Verificar console do navegador (F12)
2. Ver se API_URL está correta:
   ```javascript
   const API_URL = 'http://localhost:5000/api';
   ```
3. Verificar se backend está rodando

---

### Migrations não executam

**Solução:**

```bash
# Deletar tabela de controle e reexecutar
psql -U postgres -d rapidflow

DROP TABLE IF EXISTS schema_migrations CASCADE;
\q

# Reiniciar backend
npm start
```

---

## ✅ CHECKLIST DE TESTE

Use esta lista para validar tudo:

### Backend
- [ ] PostgreSQL instalado e rodando
- [ ] Banco `rapidflow` criado
- [ ] `.env` configurado
- [ ] `npm install` executado
- [ ] Backend inicia sem erros
- [ ] Migrations executadas (ver logs)
- [ ] Admin criado (ver logs)
- [ ] Endpoint `/health` responde: http://localhost:5000/health

### Frontend
- [ ] Frontend sendo servido (Live Server/http-server)
- [ ] Acessa login: http://localhost:3000/login.html
- [ ] Login funciona (admin@prismatech.com)
- [ ] Dashboard carrega
- [ ] Configurações preenchidas automaticamente

### Funcionalidades Novas
- [ ] Toggle "Usar IA" visível e funcional
- [ ] Campo "Tentativas" visível (valor padrão: 3)
- [ ] Counter "Taxa de Sucesso" visível
- [ ] Upload de contatos funciona
- [ ] Criar campanha funciona
- [ ] Status muda para "Em Execução"
- [ ] Polling inicia (ver console do navegador)

### Banco de Dados
- [ ] Tabela `users` existe
- [ ] Tabela `campaigns` existe
- [ ] Tabela `campaign_message_logs` existe
- [ ] Tabela `schema_migrations` existe
- [ ] Colunas `use_ai` e `max_retries` em `user_configs`
- [ ] Colunas `current_position` e `last_update` em `campaigns`

---

## 📊 PRÓXIMOS PASSOS

Depois de testar localmente:

1. **Testar com n8n real:**
   - Configurar webhook n8n local ou usar o da produção
   - Importar workflow melhorado (`n8n-workflow-improved.json`)
   - Executar campanha real

2. **Deploy em produção:**
   - Fazer push para GitHub
   - Atualizar no Render
   - Testar em produção

3. **Monitorar logs:**
   - Ver callbacks chegando no backend
   - Verificar mensagens no banco
   - Validar taxa de sucesso

---

## 🆘 PRECISA DE AJUDA?

Se encontrar algum problema:

1. Verificar logs do backend (terminal onde rodou `npm start`)
2. Verificar console do navegador (F12)
3. Verificar se todas as variáveis do `.env` estão corretas
4. Testar endpoints manualmente com curl/Postman

---

**Versão:** 2.5
**Data:** 2025-11-13
**Autor:** Claude Code

**Bom teste! 🚀**
