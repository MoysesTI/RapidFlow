# 🚀 Guia de Instalação RapidFlow - Windows + PostgreSQL 17

> **Guia completo para configurar o RapidFlow no Windows com PostgreSQL 17**

---

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Instalação do PostgreSQL 17](#-instalação-do-postgresql-17)
3. [Instalação do Node.js](#-instalação-do-nodejs)
4. [Configuração do Projeto](#-configuração-do-projeto)
5. [Configuração do Banco de Dados](#-configuração-do-banco-de-dados)
6. [Execução do Sistema](#-execução-do-sistema)
7. [Solução de Problemas](#-solução-de-problemas)
8. [Comandos Úteis](#-comandos-úteis)

---

## ✅ Pré-requisitos

Antes de começar, você precisará ter instalado:

- ✅ **Windows 10/11**
- ✅ **PostgreSQL 17** (instalado em `C:\Program Files\PostgreSQL\17\`)
- ✅ **Node.js 18+** (LTS recomendado)
- ✅ **Git** (opcional, para versionamento)
- ✅ **Editor de Código** (VS Code recomendado)

---

## 🐘 Instalação do PostgreSQL 17

### Passo 1: Verificar se o PostgreSQL está instalado

O sistema detectou automaticamente que você tem PostgreSQL 17 instalado em:
```
C:\Program Files\PostgreSQL\17\data
```

### Passo 2: Verificar se o serviço está rodando

1. Pressione `Win + R` e digite: `services.msc`
2. Procure por **"postgresql-x64-17"** ou **"PostgreSQL 17 Server"**
3. Status deve estar **"Em execução"**

Se não estiver rodando:
- Clique com botão direito → **Iniciar**

### Passo 3: Verificar a senha do PostgreSQL

Durante a instalação do PostgreSQL, você definiu uma senha para o usuário `postgres`.

⚠️ **IMPORTANTE**: Você precisará dessa senha para configurar o RapidFlow!

Se não lembra a senha:
1. Abra o **pgAdmin 4** (instalado junto com PostgreSQL)
2. Tente conectar ao servidor
3. Se não conseguir, será necessário redefinir a senha

---

## 🟢 Instalação do Node.js

### Passo 1: Baixar e Instalar

1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS (Long Term Support)**
3. Execute o instalador
4. Marque a opção: ☑️ **"Automatically install the necessary tools"**

### Passo 2: Verificar Instalação

Abra o **PowerShell** ou **CMD** e execute:

```powershell
node --version
# Deve mostrar: v18.x.x ou superior

npm --version
# Deve mostrar: 9.x.x ou superior
```

---

## ⚙️ Configuração do Projeto

### Passo 1: Navegar até a pasta do projeto

```powershell
cd caminho\para\RapidFlow\backend
```

### Passo 2: Instalar Dependências

```powershell
npm install
```

Aguarde a instalação de todas as dependências (pode levar alguns minutos).

### Passo 3: Configurar variáveis de ambiente (.env)

**O arquivo `.env` já foi criado para você!** Agora você precisa apenas configurar a senha:

1. Abra o arquivo `/backend/.env` em um editor de texto
2. Localize a linha:
   ```env
   DB_PASSWORD=SUA_SENHA_DO_POSTGRES_AQUI
   ```
3. Substitua `SUA_SENHA_DO_POSTGRES_AQUI` pela senha que você definiu ao instalar o PostgreSQL
4. Salve o arquivo

**Exemplo de .env configurado:**
```env
# BANCO DE DADOS (PostgreSQL 17 - Windows)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=minhasenha123  # ← Sua senha aqui!
DB_SSL=false
```

⚠️ **IMPORTANTE**:
- Não compartilhe este arquivo!
- Não faça commit do arquivo `.env` no Git!
- Mantenha a senha segura!

---

## 🗄️ Configuração do Banco de Dados

Agora você tem **3 opções** para configurar o banco:

### 🔥 OPÇÃO 1: Script Automático (RECOMENDADO para Windows)

Execute o script PowerShell que já foi criado para você:

```powershell
# Navegue até a pasta backend
cd backend

# Execute o script
.\setup-database-windows.ps1
```

Este script irá:
- ✅ Verificar o arquivo `.env`
- ✅ Localizar sua instalação do PostgreSQL 17
- ✅ Testar a conexão com o banco
- ✅ Criar o banco de dados `rapidflow`
- ✅ Executar todas as 5 migrações
- ✅ Criar o usuário administrador
- ✅ Configurar tudo automaticamente!

---

### ⚡ OPÇÃO 2: Auto-Migration (Automático ao iniciar)

Se preferir que o sistema configure automaticamente ao iniciar:

```powershell
npm start
```

O sistema irá:
- Detectar que o banco não existe
- Criar todas as tabelas automaticamente
- Criar o usuário administrador
- Iniciar o servidor

---

### 🔧 OPÇÃO 3: Manual (Usando pgAdmin)

Se preferir configurar manualmente:

1. Abra o **pgAdmin 4**
2. Conecte ao servidor PostgreSQL local
3. Clique com botão direito em **"Databases"** → **"Create"** → **"Database"**
4. Nome: `rapidflow`
5. Owner: `postgres`
6. Clique em **"Save"**

Depois, execute as migrações:

7. Clique com botão direito no banco `rapidflow` → **"Query Tool"**
8. Abra e execute cada arquivo SQL (na ordem):
   - `migrations/001_schema.sql`
   - `migrations/002_add_contacts_column.sql`
   - `migrations/003_campaign_logs.sql`
   - `migrations/004_campaign_events.sql`
   - `migrations/005_custom_campaigns.sql`

---

## 🚀 Execução do Sistema

### Iniciar o Servidor Backend

```powershell
# Na pasta backend
npm start
```

Você verá algo como:

```
✅ Conectado ao PostgreSQL
🔧 Verificando banco de dados...
📁 Encontradas 5 migrations
✅ Banco de dados configurado e atualizado!
🚀 Servidor rodando em http://localhost:5000
🔌 WebSocket Server rodando na porta 5000
```

### Acessar o Frontend

Você tem 2 opções:

#### Opção 1: Live Server (VS Code)
1. Instale a extensão **"Live Server"** no VS Code
2. Abra a pasta `frontend` no VS Code
3. Clique com botão direito em `login.html` → **"Open with Live Server"**

#### Opção 2: Servidor HTTP Simples
```powershell
# Na pasta frontend
npx http-server -p 3000
```

Depois acesse: **http://localhost:3000/login.html**

---

## 🔐 Credenciais de Acesso

Após a configuração, use estas credenciais para fazer login:

```
Email:    admin@prismatech.com
Senha:    #serverprisma@dti
Usuário:  prismaAdministrador
Papel:    admin
```

---

## 🔧 Solução de Problemas

### ❌ Erro: "Não foi possível conectar ao PostgreSQL"

**Causa**: PostgreSQL não está rodando ou senha incorreta

**Solução**:
1. Verifique se o serviço está rodando em `services.msc`
2. Verifique se a senha no `.env` está correta
3. Tente conectar pelo pgAdmin 4 com a mesma senha

---

### ❌ Erro: "psql.exe não encontrado"

**Causa**: PostgreSQL não está no PATH do sistema

**Solução**:
1. Adicione ao PATH: `C:\Program Files\PostgreSQL\17\bin`
2. Ou edite o script `setup-database-windows.ps1` e adicione o caminho correto

---

### ❌ Erro: "bcrypt não encontrado"

**Causa**: Dependências não foram instaladas

**Solução**:
```powershell
cd backend
npm install
```

---

### ❌ Erro: "Porta 5000 já está em uso"

**Causa**: Outra aplicação está usando a porta 5000

**Solução**:
1. Feche a aplicação que está usando a porta
2. Ou altere a porta no `.env`:
   ```env
   PORT=5001
   ```

---

### ❌ Erro ao executar script PowerShell

**Causa**: Política de execução do PowerShell

**Solução**:
```powershell
# Executar PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Depois executar o script novamente
.\setup-database-windows.ps1
```

---

## 💡 Comandos Úteis

### Backend

```powershell
# Instalar dependências
npm install

# Iniciar servidor (desenvolvimento)
npm start

# Resetar banco de dados (Node.js)
npm run reset-db

# Resetar banco de dados (PowerShell)
.\setup-database-windows.ps1
```

### PostgreSQL (via CMD/PowerShell)

```powershell
# Conectar ao banco via terminal
psql -U postgres -d rapidflow

# Listar bancos
psql -U postgres -c "\l"

# Dropar banco
psql -U postgres -c "DROP DATABASE rapidflow;"

# Criar banco
psql -U postgres -c "CREATE DATABASE rapidflow;"
```

### Git

```powershell
# Ver status
git status

# Fazer commit
git add .
git commit -m "Configuração inicial"

# Ver branch atual
git branch
```

---

## 📊 Estrutura do Banco de Dados

Após a configuração, seu banco terá:

### Tabelas Principais:
- `users` - Usuários do sistema
- `user_configs` - Configurações individuais
- `campaigns` - Campanhas criadas
- `campaign_contacts` - Contatos das campanhas
- `campaign_message_logs` - Logs de mensagens enviadas
- `campaign_events` - Eventos e métricas
- `audit_logs` - Auditoria do sistema
- `schema_migrations` - Controle de migrações

---

## 🎯 Próximos Passos

Após a instalação bem-sucedida:

1. ✅ **Login**: Acesse o frontend e faça login com as credenciais do admin
2. ✅ **Configuração**: Configure suas credenciais de API (Evolution, OpenAI, etc.)
3. ✅ **Teste**: Crie uma campanha de teste com poucos contatos
4. ✅ **Produção**: Configure o sistema para produção (se necessário)

---

## 📚 Documentação Adicional

- `README.md` - Documentação principal do projeto
- `GUIA_TESTE_LOCAL.md` - Guia detalhado de testes
- `UPGRADE_GUIDE.md` - Guia de atualização v3.0
- `ENHANCED_FEATURES.md` - Recursos avançados

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique os logs do servidor
2. Verifique os logs do PostgreSQL em: `C:\Program Files\PostgreSQL\17\data\log\`
3. Consulte a documentação
4. Verifique se todas as dependências estão instaladas

---

## ✅ Checklist de Instalação

Use este checklist para garantir que tudo está configurado:

- [ ] PostgreSQL 17 instalado e rodando
- [ ] Node.js 18+ instalado
- [ ] Dependências instaladas (`npm install`)
- [ ] Arquivo `.env` configurado com senha correta
- [ ] Banco de dados criado (manual ou automático)
- [ ] Migrações executadas
- [ ] Usuário admin criado
- [ ] Servidor backend iniciando sem erros
- [ ] Frontend acessível
- [ ] Login funcionando com credenciais do admin

---

**🎉 Parabéns! Seu RapidFlow está pronto para uso!**

---

*Última atualização: 2024-11-14*
*Versão: 3.0.0*
*Sistema: Windows + PostgreSQL 17*
