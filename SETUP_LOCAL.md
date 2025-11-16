# 🔧 RAPIDFLOW - GUIA DE SETUP LOCAL

> **Última Atualização:** 2025-11-15
> **Objetivo:** Rodar o RapidFlow completamente em ambiente local (desenvolvimento)

---

## ✅ PRÉ-REQUISITOS

### Ferramentas Instaladas (Verificado)
- ✅ **Node.js:** v22.21.1 (requer >=18.0.0)
- ✅ **npm:** 10.9.4
- ✅ **PostgreSQL:** 16.10

### O que Está Faltando
- ❌ Dependências Node.js (node_modules)
- ❌ Arquivo `.env` configurado
- ❌ Banco de dados criado
- ❌ PostgreSQL rodando (verificar)

---

## 🚀 PASSO A PASSO COMPLETO

### **PASSO 1: Verificar PostgreSQL**

```bash
# Verificar se PostgreSQL está rodando
pg_isready

# Se não estiver rodando, iniciar:
# Linux/WSL
sudo service postgresql start

# macOS
brew services start postgresql

# Docker (alternativa)
docker run --name rapidflow-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rapidflow \
  -p 5432:5432 \
  -d postgres:16
```

**Verificar conexão:**
```bash
psql -U postgres -c "SELECT version();"
```

---

### **PASSO 2: Criar Banco de Dados**

```bash
# Conectar ao PostgreSQL
psql -U postgres

# Dentro do psql:
CREATE DATABASE rapidflow;
CREATE USER rapidflow_user WITH PASSWORD 'rapidflow_dev_2024';
GRANT ALL PRIVILEGES ON DATABASE rapidflow TO rapidflow_user;

# Sair
\q
```

**Verificar:**
```bash
psql -U postgres -d rapidflow -c "\dt"
# Deve retornar "Did not find any relations." (normal, tabelas serão criadas pela migration)
```

---

### **PASSO 3: Instalar Dependências Backend**

```bash
cd /home/user/RapidFlow/backend

# Instalar todas dependências do package.json
npm install

# Verificar instalação
ls -la node_modules/ | wc -l
# Deve mostrar ~200+ pastas
```

**Dependências principais que serão instaladas:**
- express (servidor web)
- pg (PostgreSQL driver)
- jsonwebtoken (autenticação)
- bcrypt (hash de senhas)
- multer (upload de arquivos)
- axios (requisições HTTP)
- E mais 20+ pacotes...

---

### **PASSO 4: Configurar Arquivo .env**

```bash
cd /home/user/RapidFlow/backend

# Copiar template
cp .env.example .env

# Editar com suas configurações locais
nano .env  # ou vim, code, etc.
```

**Conteúdo do .env para DESENVOLVIMENTO LOCAL:**

```bash
# ═══════════════════════════════════════════════════════════
# RAPIDFLOW - CONFIGURAÇÃO LOCAL DE DESENVOLVIMENTO
# ═══════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────────
# SERVIDOR
# ────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ────────────────────────────────────────────────────────────
# BANCO DE DADOS (PostgreSQL Local)
# ────────────────────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=rapidflow_user
DB_PASSWORD=rapidflow_dev_2024
DB_SSL=false

# ────────────────────────────────────────────────────────────
# SEGURANÇA (DESENVOLVIMENTO)
# ────────────────────────────────────────────────────────────
JWT_SECRET=dev_secret_key_min_32_characters_local_only_not_for_production
JWT_EXPIRES_IN=24h

# ────────────────────────────────────────────────────────────
# CORS (Permitir localhost)
# ────────────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500

# ────────────────────────────────────────────────────────────
# ADMIN PADRÃO (Usuário criado automaticamente)
# ────────────────────────────────────────────────────────────
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# ────────────────────────────────────────────────────────────
# CONFIGURAÇÕES PADRÃO (Opcional para testes locais)
# ────────────────────────────────────────────────────────────
# Deixe em branco ou use webhooks de teste:
DEFAULT_WEBHOOK_URL=https://webhook.site/seu-webhook-teste
DEFAULT_EVOLUTION_ENDPOINT=https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem
DEFAULT_EVOLUTION_API_KEY=SUA_CHAVE_AQUI
DEFAULT_OPENAI_API_KEY=sk-SUA_CHAVE_OPENAI_AQUI
```

**⚠️ IMPORTANTE:**
- **JWT_SECRET:** Mínimo 32 caracteres (validado pelo código)
- **CORS_ORIGIN:** Adicione a porta do seu frontend (3000, 5500, etc.)
- **Credenciais:** NUNCA use essas senhas em produção!

---

### **PASSO 5: Iniciar Backend**

```bash
cd /home/user/RapidFlow/backend

# Modo produção (normal)
npm start

# OU modo desenvolvimento (com auto-reload)
npm run dev
```

**Saída esperada:**
```
═══════════════════════════════════════════════════════════════
   🚀  RAPIDFLOW BACKEND
═══════════════════════════════════════════════════════════════
   📦  Versão: 2.0.0
   🌍  Ambiente: development
   🔌  Porta: 5000
   🕒  Horário: 2025-11-15T15:30:00.000Z
═══════════════════════════════════════════════════════════════

✅ Database conectado com sucesso!
🔄 Executando migrations...
✅ Migrations executadas com sucesso!
👤 Usuário admin criado: admin@prismatech.com
🚀 Servidor rodando na porta 5000
```

**Verificar health check:**
```bash
curl http://localhost:5000/health

# Deve retornar:
{
  "status": "ok",
  "version": "2.3.0",
  "timestamp": "...",
  "database": "connected",
  "environment": "development"
}
```

---

### **PASSO 6: Configurar Frontend**

#### Opção A: Servidor HTTP simples (Recomendado)

```bash
cd /home/user/RapidFlow/frontend

# Usando http-server (instalar globalmente)
npm install -g http-server
http-server -p 3000 -c-1

# OU usando Python
python3 -m http.server 3000

# OU usando Node http-server sem instalar globalmente
npx http-server -p 3000 -c-1
```

#### Opção B: Live Server (VS Code)

1. Abra `/home/user/RapidFlow/frontend` no VS Code
2. Instale extensão "Live Server"
3. Clique direito em `login.html` → "Open with Live Server"
4. Abre automaticamente em `http://127.0.0.1:5500`

#### Opção C: Nginx (Avançado)

```bash
# Instalar nginx
sudo apt install nginx

# Configurar
sudo nano /etc/nginx/sites-available/rapidflow

# Conteúdo:
server {
    listen 3000;
    server_name localhost;
    root /home/user/RapidFlow/frontend;
    index login.html;

    location / {
        try_files $uri $uri/ =404;
    }
}

# Ativar
sudo ln -s /etc/nginx/sites-available/rapidflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo service nginx restart
```

**⚠️ Atualizar API URL no Frontend:**

Edite `/home/user/RapidFlow/frontend/js/api.js`:

```javascript
// Linha ~3
const API_URL = 'http://localhost:5000/api';  // ← Alterar para localhost
```

---

### **PASSO 7: Acessar o Sistema**

1. **Abra o navegador:**
   ```
   http://localhost:3000/login.html
   ```

2. **Faça login com admin:**
   - Email: `admin@prismatech.com`
   - Senha: `admin123` (ou o que você definiu no .env)

3. **Ou cadastre novo usuário:**
   - Clique em "Cadastre-se"
   - Preencha formulário
   - Faça login

4. **Dashboard:**
   ```
   http://localhost:3000/index.html
   ```

---

## 🧪 TESTANDO O SISTEMA

### Teste 1: Criar Campanha

1. Faça upload de arquivo CSV/Excel com contatos:
   ```csv
   nome,telefone
   Maria Silva,11999999999
   João Santos,11888888888
   ```

2. Preencha configuração da campanha
3. Clique em "Criar e Executar Campanha"

**⚠️ IMPORTANTE:** Se não tiver webhook/Evolution API configurado, a campanha será criada mas falhará na execução. Isso é esperado em ambiente local.

### Teste 2: Verificar Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -U rapidflow_user -d rapidflow

# Listar tabelas
\dt

# Ver usuários
SELECT id, username, email, role FROM users;

# Ver campanhas
SELECT id, campaign_id, name, status, total_contacts FROM campaigns;

# Ver logs de auditoria
SELECT id, action, entity_type, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10;

# Sair
\q
```

### Teste 3: API via curl

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@prismatech.com","password":"admin123"}'

# Salvar o token retornado e usar em requests autenticados:
TOKEN="seu_token_jwt_aqui"

# Listar campanhas
curl http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer $TOKEN"

# Ver configurações do usuário
curl http://localhost:5000/api/config \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: "Cannot find module 'express'"

**Causa:** Dependências não instaladas

**Solução:**
```bash
cd /home/user/RapidFlow/backend
rm -rf node_modules package-lock.json
npm install
```

---

### Problema 2: "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Causa:** PostgreSQL não está rodando

**Solução:**
```bash
# Verificar status
pg_isready

# Se não estiver rodando:
sudo service postgresql start

# Verificar novamente
pg_isready
```

---

### Problema 3: "JWT_SECRET must be at least 20 characters"

**Causa:** JWT_SECRET no .env está muito curto

**Solução:**
```bash
# Editar .env
nano /home/user/RapidFlow/backend/.env

# Alterar JWT_SECRET para algo com 32+ caracteres:
JWT_SECRET=dev_secret_key_min_32_characters_local_only_not_for_production
```

---

### Problema 4: CORS Error no navegador

**Causa:** Frontend rodando em porta não autorizada

**Solução:**
```bash
# Editar .env e adicionar a porta do frontend:
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:5500

# Reiniciar backend
npm run dev
```

---

### Problema 5: "relation 'users' does not exist"

**Causa:** Migrations não rodaram

**Solução:**
```bash
# Verificar tabelas
psql -U rapidflow_user -d rapidflow -c "\dt"

# Se vazio, rodar migration manual:
psql -U rapidflow_user -d rapidflow -f /home/user/RapidFlow/backend/migrations/001_schema.sql

# Criar admin manualmente:
psql -U rapidflow_user -d rapidflow
INSERT INTO users (username, email, password_hash, first_name, last_name, role)
VALUES ('admin', 'admin@prismatech.com', '$2b$10$...', 'Admin', 'Sistema', 'admin');
```

---

### Problema 6: Frontend não carrega (404)

**Causa:** Servidor HTTP não está rodando

**Solução:**
```bash
# Verificar se http-server está rodando
lsof -i :3000

# Se não estiver:
cd /home/user/RapidFlow/frontend
npx http-server -p 3000 -c-1
```

---

### Problema 7: API retorna "Invalid token"

**Causa:** Token expirado ou inválido

**Solução:**
```javascript
// Abra o navegador, vá no console (F12):
localStorage.clear();
// Recarregue a página e faça login novamente
```

---

## 📊 ESTRUTURA DE DIRETÓRIOS APÓS SETUP

```
/home/user/RapidFlow/
├── backend/
│   ├── node_modules/        ← Criado após npm install
│   ├── migrations/
│   ├── src/
│   ├── .env                 ← Criado manualmente
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend/
│   ├── css/
│   ├── js/
│   │   └── api.js           ← EDITAR: API_URL para localhost
│   ├── index.html
│   └── login.html
├── README.md
├── README_ARQUITETURA.md
└── SETUP_LOCAL.md           ← Este arquivo
```

---

## 🎯 CHECKLIST FINAL

Antes de começar a desenvolver, verifique:

- [ ] PostgreSQL rodando (`pg_isready` retorna OK)
- [ ] Banco de dados `rapidflow` criado
- [ ] Dependências instaladas (`backend/node_modules/` existe)
- [ ] Arquivo `.env` configurado com valores locais
- [ ] Backend rodando (`curl http://localhost:5000/health` retorna OK)
- [ ] Frontend rodando (acessa `http://localhost:3000/login.html`)
- [ ] Consegue fazer login com admin
- [ ] Consegue criar usuário novo
- [ ] CORS configurado (sem erros no console do navegador)

---

## 🚀 COMANDOS RÁPIDOS

```bash
# Iniciar tudo de uma vez (2 terminais)

# Terminal 1 - Backend
cd /home/user/RapidFlow/backend && npm run dev

# Terminal 2 - Frontend
cd /home/user/RapidFlow/frontend && npx http-server -p 3000 -c-1

# Acessar: http://localhost:3000/login.html
```

---

## 💡 DICAS DE DESENVOLVIMENTO

1. **Logs em Tempo Real:**
   ```bash
   # Backend mostra todos requests quando NODE_ENV=development
   npm run dev
   ```

2. **Resetar Banco de Dados:**
   ```bash
   psql -U postgres -c "DROP DATABASE rapidflow;"
   psql -U postgres -c "CREATE DATABASE rapidflow;"
   # Reiniciar backend (auto-migration recria tudo)
   ```

3. **Testar Webhooks Localmente:**
   - Use [webhook.site](https://webhook.site) para gerar URL de teste
   - Coloque a URL em `DEFAULT_WEBHOOK_URL` no .env
   - Veja requests chegando em tempo real

4. **Debugar Backend:**
   ```bash
   # Adicionar no package.json:
   "debug": "node --inspect src/server.js"

   # Rodar:
   npm run debug

   # Abrir Chrome: chrome://inspect
   ```

5. **Hot Reload Frontend:**
   - Use Live Server (VS Code)
   - Ou http-server com watch (não suportado nativamente)

---

## ⚠️ DIFERENÇAS ENTRE LOCAL E PRODUÇÃO

| Aspecto | Local (Desenvolvimento) | Produção (Render) |
|---------|-------------------------|-------------------|
| **Banco de Dados** | PostgreSQL local | Render PostgreSQL |
| **SSL** | `DB_SSL=false` | `DB_SSL=true` |
| **CORS** | `localhost` permitido | Apenas domínio frontend |
| **Logs** | Morgan ativo | Morgan desabilitado |
| **Erros** | Stack trace completo | Mensagens genéricas |
| **JWT_SECRET** | Dev secret | Secret forte aleatório |
| **Admin Password** | `admin123` | Senha forte |
| **Webhooks** | Opcional (teste) | URLs reais (Evolution/n8n) |

---

## 📞 PRÓXIMOS PASSOS

Após rodar localmente:

1. ✅ **Teste todas funcionalidades** (criar campanha, upload, etc.)
2. ✅ **Implemente melhorias** conforme README_ARQUITETURA.md
3. ✅ **Commite mudanças** no branch de desenvolvimento
4. ✅ **Teste em produção** (Render) antes de merge

---

**Última Atualização:** 2025-11-15
**Mantenedor:** Equipe RapidFlow
**Suporte:** Consulte CLAUDE.md e README_ARQUITETURA.md
