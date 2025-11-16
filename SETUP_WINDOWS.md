# 🪟 RAPIDFLOW - SETUP LOCAL WINDOWS

> **Para:** Desenvolvimento local no Windows
> **Objetivo:** Configurar RapidFlow localmente SEM afetar produção (Render)
> **Data:** 2025-11-15

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Instalação do PostgreSQL](#instalação-do-postgresql)
3. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
4. [Setup do Backend](#setup-do-backend)
5. [Setup do Frontend](#setup-do-frontend)
6. [Testes](#testes)
7. [Troubleshooting Windows](#troubleshooting-windows)

---

## 🔧 PRÉ-REQUISITOS

### O que você precisa ter instalado:

#### 1. **Node.js 18+** (OBRIGATÓRIO)

**Verificar se já tem:**
```powershell
node --version
npm --version
```

**Se não tiver, instalar:**
1. Baixe: https://nodejs.org/en/download/
2. Escolha: **LTS (Long Term Support)** - Versão 20.x ou superior
3. Execute o instalador
4. Marque: ✅ "Automatically install the necessary tools" (opcional)
5. Clique "Next" até finalizar
6. **Reinicie o terminal** após instalação

**Verificar instalação:**
```powershell
node --version  # Deve mostrar v18.x ou superior
npm --version   # Deve mostrar 9.x ou superior
```

---

#### 2. **PostgreSQL 15+** (OBRIGATÓRIO)

**Verificar se já tem:**
```powershell
psql --version
```

**Se não tiver, instalar:**

1. **Baixe o instalador:**
   - https://www.postgresql.org/download/windows/
   - Ou use o instalador EDB: https://www.enterprisedb.com/downloads/postgres-postgresql-downloads
   - Versão recomendada: **PostgreSQL 16.x**

2. **Execute o instalador:**
   - Senha do superusuário `postgres`: **ANOTE ESSA SENHA!** (ex: `postgres123`)
   - Porta: `5432` (padrão)
   - Locale: `Portuguese, Brazil` ou `Default locale`
   - **Marque:** ✅ PostgreSQL Server, pgAdmin 4, Command Line Tools

3. **Adicionar ao PATH (se não adicionado automaticamente):**
   - Vá em: `Painel de Controle > Sistema > Configurações Avançadas > Variáveis de Ambiente`
   - Em "Variáveis do Sistema", edite `Path`
   - Adicione: `C:\Program Files\PostgreSQL\16\bin`
   - Clique OK
   - **Reinicie o terminal**

4. **Verificar instalação:**
   ```powershell
   psql --version  # Deve mostrar "psql (PostgreSQL) 16.x"
   ```

---

#### 3. **Git** (OBRIGATÓRIO - você já tem se fez o clone)

**Verificar:**
```powershell
git --version
```

Se não tiver: https://git-scm.com/download/win

---

#### 4. **Editor de Código** (RECOMENDADO)

- **VS Code:** https://code.visualstudio.com/
- Ou qualquer editor (Notepad++, Sublime, etc.)

---

## 🗄️ INSTALAÇÃO DO POSTGRESQL

### Opção A: Usando o Instalador (Recomendado)

Siga os passos da seção "Pré-requisitos" acima.

### Opção B: Usando Chocolatey (Avançado)

```powershell
# Instalar Chocolatey primeiro (se não tiver)
# Abra PowerShell como Administrador:
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar PostgreSQL
choco install postgresql16 -y
```

### Opção C: Usando Docker (Avançado)

```powershell
# Se tiver Docker Desktop instalado:
docker run --name rapidflow-postgres ^
  -e POSTGRES_PASSWORD=postgres ^
  -e POSTGRES_DB=rapidflow ^
  -p 5432:5432 ^
  -d postgres:16

# Verificar se está rodando:
docker ps
```

---

## 🔐 CONFIGURAÇÃO DO BANCO DE DADOS

### 1. **Conectar ao PostgreSQL**

Abra o **pgAdmin 4** (instalado com PostgreSQL) ou use o terminal:

**Usando pgAdmin 4:**
1. Abra o pgAdmin
2. Senha: (a que você definiu na instalação)
3. Vá em: Servers > PostgreSQL 16 > Databases

**Usando Terminal:**
```powershell
# Conectar como superusuário
psql -U postgres

# Se pedir senha, digite a que você definiu na instalação
```

---

### 2. **Criar Banco de Dados**

**No terminal psql:**
```sql
-- Criar banco de dados
CREATE DATABASE rapidflow;

-- Criar usuário específico (opcional, recomendado)
CREATE USER rapidflow_user WITH PASSWORD 'rapidflow_dev_2024';

-- Dar permissões
GRANT ALL PRIVILEGES ON DATABASE rapidflow TO rapidflow_user;

-- Conectar ao banco criado
\c rapidflow

-- Habilitar extensão UUID (necessária)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sair
\q
```

**No pgAdmin 4:**
1. Clique direito em "Databases" > Create > Database
2. Nome: `rapidflow`
3. Owner: `postgres` (ou `rapidflow_user` se criou)
4. Clique "Save"
5. Clique direito no banco `rapidflow` > Query Tool
6. Execute: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

---

### 3. **Verificar Criação**

```powershell
# Listar bancos de dados
psql -U postgres -l

# Deve aparecer "rapidflow" na lista
```

---

## 🔧 SETUP DO BACKEND

### 1. **Navegar até a pasta do projeto**

```powershell
cd C:\Users\MOYSES\Documents\Sistema\RapidFlow-main\backend
```

---

### 2. **Instalar Dependências**

```powershell
npm install
```

**Saída esperada:**
```
added 150 packages, and audited 151 packages in 30s
found 0 vulnerabilities
```

**Se der erro de `node-gyp` (bcrypt):**
```powershell
# Instalar ferramentas de build
npm install --global windows-build-tools

# Tentar novamente
npm install
```

---

### 3. **Criar Arquivo .env**

```powershell
# Copiar template
copy .env.example .env

# Editar com bloco de notas
notepad .env
```

**Ou usar VS Code:**
```powershell
code .env
```

---

### 4. **Configurar .env para Windows Local**

**Cole este conteúdo no arquivo `.env`:**

```bash
# ═══════════════════════════════════════════════════════════
# RAPIDFLOW - CONFIGURAÇÃO LOCAL WINDOWS
# ═══════════════════════════════════════════════════════════
# ⚠️ AMBIENTE DE DESENVOLVIMENTO - NÃO USAR EM PRODUÇÃO!
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
DB_USER=postgres
DB_PASSWORD=postgres123
DB_SSL=false

# ⚠️ ALTERE "postgres123" para a senha que você definiu!

# ────────────────────────────────────────────────────────────
# SEGURANÇA (SOMENTE DESENVOLVIMENTO!)
# ────────────────────────────────────────────────────────────
JWT_SECRET=dev_secret_key_min_32_characters_local_only_not_for_production_windows
JWT_EXPIRES_IN=24h

# ────────────────────────────────────────────────────────────
# CORS (Permitir localhost - Windows)
# ────────────────────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5500,http://127.0.0.1:5500

# ────────────────────────────────────────────────────────────
# ADMIN PADRÃO (Criado automaticamente)
# ────────────────────────────────────────────────────────────
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# ────────────────────────────────────────────────────────────
# CONFIGURAÇÕES PADRÃO (Opcional - para testes)
# ────────────────────────────────────────────────────────────
# Deixe em branco se não for testar envios reais:
DEFAULT_WEBHOOK_URL=
DEFAULT_EVOLUTION_ENDPOINT=
DEFAULT_EVOLUTION_API_KEY=
DEFAULT_OPENAI_API_KEY=
```

**⚠️ IMPORTANTE:**
- **DB_PASSWORD**: Troque `postgres123` pela senha que você definiu na instalação do PostgreSQL
- **JWT_SECRET**: Já está com 32+ caracteres (obrigatório)
- **ADMIN_PASSWORD**: Senha para primeiro acesso (`admin123`)

**Salve o arquivo** (Ctrl+S)

---

### 5. **Testar Conexão com Banco**

```powershell
# Ainda na pasta backend
node -e "const { Pool } = require('pg'); const pool = new Pool({ host: 'localhost', database: 'rapidflow', user: 'postgres', password: 'postgres123' }); pool.query('SELECT NOW()', (err, res) => { console.log(err ? err.message : 'Conectado!'); pool.end(); });"
```

**Deve retornar:** `Conectado!`

**Se der erro:** Verifique a senha no .env

---

### 6. **Iniciar Backend**

```powershell
# Modo desenvolvimento (com auto-reload)
npm run dev

# OU modo produção (sem auto-reload)
npm start
```

**Saída esperada:**
```
═══════════════════════════════════════════════════════════════
   🚀  RAPIDFLOW BACKEND
═══════════════════════════════════════════════════════════════
   📦  Versão: 2.0.0
   🌍  Ambiente: development
   🔌  Porta: 5000
   🕒  Horário: 2025-11-15T18:30:00.000Z
═══════════════════════════════════════════════════════════════

✅ Database conectado com sucesso!
🔄 Executando migrations...
✅ Migrations executadas com sucesso!
👤 Usuário admin criado: admin@prismatech.com
🚀 Servidor rodando na porta 5000
```

**Verificar health check (abra novo terminal):**
```powershell
curl http://localhost:5000/health

# Ou acesse no navegador: http://localhost:5000/health
```

**Deve retornar:**
```json
{
  "status": "ok",
  "version": "2.3.0",
  "timestamp": "...",
  "database": "connected",
  "environment": "development"
}
```

**✅ Backend configurado!** Deixe este terminal aberto (servidor rodando).

---

## 🌐 SETUP DO FRONTEND

### 1. **Atualizar URL da API**

**Abra o arquivo:**
```
C:\Users\MOYSES\Documents\Sistema\RapidFlow-main\frontend\js\api.js
```

**Edite a linha ~3:**
```javascript
// ANTES (produção):
const API_URL = 'https://rapidflow-backend.onrender.com/api';

// DEPOIS (local):
const API_URL = 'http://localhost:5000/api';
```

**Salve o arquivo** (Ctrl+S)

**⚠️ IMPORTANTE:** Esse arquivo NÃO deve ser commitado com `localhost`! É só para desenvolvimento local.

---

### 2. **Iniciar Servidor Frontend**

Abra **OUTRO terminal PowerShell/CMD**:

```powershell
# Navegar para pasta frontend
cd C:\Users\MOYSES\Documents\Sistema\RapidFlow-main\frontend

# Opção A: Usando http-server (instalar globalmente)
npm install -g http-server
http-server -p 3000 -c-1

# Opção B: Usando npx (sem instalar globalmente)
npx http-server -p 3000 -c-1

# Opção C: Usando Python (se tiver instalado)
python -m http.server 3000
```

**Saída esperada:**
```
Starting up http-server, serving ./

http-server version: 14.1.1

http-server settings:
CORS: disabled
Cache: -1 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  http://127.0.0.1:3000
  http://192.168.0.x:3000
Hit CTRL-C to stop the server
```

**✅ Frontend rodando!** Deixe este terminal aberto também.

---

### 3. **Acessar o Sistema**

Abra o navegador (Chrome, Edge, Firefox):

```
http://localhost:3000/login.html
```

**OU:**
```
http://127.0.0.1:3000/login.html
```

**Deve aparecer a tela de login!** 🎉

---

## 🧪 TESTES

### 1. **Login com Admin**

**Credenciais padrão:**
- **Email:** `admin@prismatech.com`
- **Senha:** `admin123`

Clique em "Entrar"

**Deve redirecionar para:** `http://localhost:3000/index.html` (Dashboard)

---

### 2. **Criar Novo Usuário**

1. Volte para: `http://localhost:3000/login.html`
2. Clique em "Cadastre-se"
3. Preencha:
   - Nome: Seu nome
   - Sobrenome: Seu sobrenome
   - Email: seu@email.com
   - Telefone: (11) 99999-9999
   - Senha: teste123
   - Confirmar senha: teste123
4. Clique "Cadastrar"

**Deve logar automaticamente!**

---

### 3. **Criar Campanha de Teste**

1. No dashboard, clique em "Upload de Arquivo"
2. Crie um arquivo CSV simples:

**Arquivo: `contatos_teste.csv`**
```csv
nome,telefone
Maria Silva,11999999999
João Santos,11888888888
Ana Costa,11777777777
```

3. Faça upload do arquivo
4. Preencha a configuração da campanha (pode deixar padrão)
5. Clique em "Criar e Executar Campanha"

**⚠️ Executar falhará** se não tiver webhook configurado - **ISSO É NORMAL EM LOCAL!**

Mas a campanha será **criada no banco de dados** ✅

---

### 4. **Verificar no Banco de Dados**

Abra outro terminal:

```powershell
# Conectar ao banco
psql -U postgres -d rapidflow

# Listar tabelas
\dt

# Ver usuários
SELECT id, username, email, role FROM users;

# Ver campanhas
SELECT id, name, status, total_contacts FROM campaigns;

# Sair
\q
```

---

## ⚠️ TROUBLESHOOTING WINDOWS

### Problema 1: "npm: command not found"

**Causa:** Node.js não instalado ou não está no PATH

**Solução:**
1. Reinstale Node.js: https://nodejs.org/
2. Marque "Add to PATH" no instalador
3. Reinicie o terminal (feche e abra novamente)
4. Teste: `node --version`

---

### Problema 2: "psql: command not found"

**Causa:** PostgreSQL não instalado ou não está no PATH

**Solução:**
1. Adicione ao PATH manualmente:
   - `C:\Program Files\PostgreSQL\16\bin`
2. Ou use pgAdmin para gerenciar o banco (interface gráfica)

---

### Problema 3: "Error: connect ECONNREFUSED ::1:5432"

**Causa:** PostgreSQL não está rodando

**Solução Windows:**
```powershell
# Verificar serviço
Get-Service -Name postgresql*

# Se não estiver rodando, iniciar:
Start-Service postgresql-x64-16  # Nome pode variar

# Ou use pgAdmin > Tools > Server Status
```

---

### Problema 4: "npm install" falha com erro de "node-gyp"

**Causa:** Ferramentas de build do Windows faltando (bcrypt precisa compilar)

**Solução:**
```powershell
# Opção 1: Instalar Visual Studio Build Tools
npm install --global windows-build-tools

# Opção 2: Instalar Visual Studio Community
# https://visualstudio.microsoft.com/downloads/
# Marque: "Desktop development with C++"

# Depois tentar novamente
npm install
```

---

### Problema 5: Firewall bloqueia porta 5000 ou 3000

**Causa:** Windows Firewall

**Solução:**
1. Quando aparecer o alerta do Firewall, clique "Permitir acesso"
2. Ou adicione exceção manualmente:
   - Painel de Controle > Windows Defender Firewall
   - Configurações Avançadas > Regras de Entrada
   - Nova Regra > Porta > TCP > 5000,3000 > Permitir

---

### Problema 6: "CORS error" no navegador

**Causa:** Frontend rodando em porta diferente do CORS_ORIGIN

**Solução:**
1. Verifique a porta do frontend (ex: 3000, 5500, 8080)
2. Edite `backend\.env`:
   ```
   CORS_ORIGIN=http://localhost:3000,http://localhost:5500
   ```
3. Reinicie o backend (`npm run dev`)

---

### Problema 7: "Invalid token" ao fazer requisições

**Causa:** Token expirado ou JWT_SECRET mudou

**Solução:**
```javascript
// Abra o console do navegador (F12)
localStorage.clear();
// Recarregue e faça login novamente
```

---

### Problema 8: Banco de dados não criado na inicialização

**Causa:** Migrations não rodaram

**Solução:**
```powershell
# Conectar ao PostgreSQL
psql -U postgres -d rapidflow

# Rodar migration manualmente
\i 'C:/Users/MOYSES/Documents/Sistema/RapidFlow-main/backend/migrations/001_schema.sql'

# Verificar tabelas
\dt

# Sair
\q

# Reiniciar backend
npm run dev
```

---

## 🎯 COMANDOS RÁPIDOS (Windows)

### Iniciar Backend + Frontend (2 terminais)

**Terminal 1 - Backend:**
```powershell
cd C:\Users\MOYSES\Documents\Sistema\RapidFlow-main\backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd C:\Users\MOYSES\Documents\Sistema\RapidFlow-main\frontend
npx http-server -p 3000 -c-1
```

**Acessar:** http://localhost:3000/login.html

---

### Parar Servidores

- **Backend:** `Ctrl + C` no terminal
- **Frontend:** `Ctrl + C` no terminal

---

### Resetar Banco de Dados

```powershell
# Conectar
psql -U postgres

# Dropar e recriar
DROP DATABASE rapidflow;
CREATE DATABASE rapidflow;
\c rapidflow
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q

# Reiniciar backend (migrations recriam tabelas)
npm run dev
```

---

## 📊 ESTRUTURA DE PASTAS (Windows)

```
C:\Users\MOYSES\Documents\Sistema\RapidFlow-main\
├── backend\
│   ├── node_modules\        ← Criado após npm install
│   ├── migrations\
│   ├── src\
│   ├── .env                 ← Você cria (NÃO commitar!)
│   ├── .env.example
│   ├── package.json
│   └── package-lock.json
├── frontend\
│   ├── css\
│   ├── js\
│   │   └── api.js           ← EDITAR: API_URL = localhost
│   ├── index.html
│   └── login.html
└── README.md
```

---

## 🔐 SEGURANÇA - LOCAL vs PRODUÇÃO

### ⚠️ NUNCA COMMITAR:

- ✅ `.env` (está no .gitignore)
- ✅ `api.js` com API_URL = localhost (reverter antes de commitar)
- ✅ Senhas reais

### Antes de dar Push/Commit:

```powershell
# Verificar mudanças
git status

# Se alterou api.js, reverter:
git checkout -- frontend/js/api.js

# Ou editar manualmente para voltar:
# API_URL = 'https://rapidflow-backend.onrender.com/api'
```

---

## ✅ CHECKLIST FINAL

Antes de começar a desenvolver:

- [ ] Node.js instalado (`node --version`)
- [ ] PostgreSQL instalado e rodando (`psql --version`)
- [ ] Banco `rapidflow` criado
- [ ] Dependências instaladas (`npm install` sem erros)
- [ ] Arquivo `.env` configurado com senha correta
- [ ] Backend rodando (`http://localhost:5000/health` retorna OK)
- [ ] Frontend rodando (`http://localhost:3000/login.html` abre)
- [ ] Login funciona (admin@prismatech.com / admin123)
- [ ] Pode criar novo usuário
- [ ] Não há erros CORS no console do navegador (F12)

---

## 🚀 PRÓXIMOS PASSOS

Agora que está rodando localmente:

1. ✅ **Desenvolva sem medo** - Não afeta produção!
2. ✅ **Teste mudanças localmente**
3. ✅ **Commite só o que testou**
4. ✅ **Reverta api.js antes de commitar**
5. ✅ **Nunca commite .env**

---

## 📞 SUPORTE

**Documentação:**
- README.md - Visão geral
- CLAUDE.md - Guia para IA
- README_ARQUITETURA.md - Análise técnica
- SETUP_LOCAL.md - Setup Linux/macOS
- SETUP_WINDOWS.md - Este arquivo

**Em caso de dúvidas:**
1. Verifique logs do backend (terminal)
2. Verifique console do navegador (F12)
3. Consulte seção Troubleshooting

---

**Última Atualização:** 2025-11-15
**Plataforma:** Windows 10/11
**Mantenedor:** Equipe RapidFlow
