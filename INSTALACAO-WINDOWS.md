# 🚀 Guia de Instalação RapidFlow - Windows

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

1. **PostgreSQL 16**
   - Download: https://www.postgresql.org/download/windows/
   - Senha configurada durante a instalação: `242036`
   - Usuário padrão: `postgres`

2. **Node.js 18 ou superior**
   - Download: https://nodejs.org/
   - Recomendado: versão LTS

3. **Git para Windows**
   - Download: https://git-scm.com/download/win

## 🎯 Instalação Automática (Recomendado)

### Opção 1: Instalação Completa (Clone + Configuração)

Execute este comando no PowerShell (como Administrador):

```powershell
# Baixar o script de instalação
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/MoysesTI/RapidFlow/main/setup-completo-windows.ps1" -OutFile "$env:TEMP\setup-rapidflow.ps1"

# Executar a instalação
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
& "$env:TEMP\setup-rapidflow.ps1"
```

**O script irá:**
- ✅ Clonar o repositório para `C:\projetos\RapidFlow`
- ✅ Configurar automaticamente o arquivo `.env`
- ✅ Instalar todas as dependências npm
- ✅ Criar o banco de dados PostgreSQL
- ✅ Executar todas as migrações
- ✅ Criar o usuário administrador
- ✅ Iniciar o servidor (opcional)

### Opção 2: Atualização Manual (Se já tiver o código)

Se você já tem o código em `C:\projetos\RapidFlow`, pode executar diretamente:

```powershell
cd C:\projetos\RapidFlow
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup-completo-windows.ps1
```

## 🔧 Instalação Manual

Se preferir fazer manualmente:

### 1. Clonar o Repositório

```powershell
cd C:\projetos
git clone https://github.com/MoysesTI/RapidFlow.git
cd RapidFlow\backend
```

### 2. Configurar o .env

Copie o arquivo de exemplo e edite com suas configurações:

```powershell
Copy-Item .env.example .env
notepad .env
```

Configure as seguintes variáveis:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=242036
DB_SSL=false
```

### 3. Instalar Dependências

```powershell
npm install
```

### 4. Configurar Banco de Dados

```powershell
# Usar o script de setup existente
.\setup-database-windows.ps1
```

### 5. Iniciar o Servidor

```powershell
npm start
```

## 🎫 Credenciais Padrão

Após a instalação, use estas credenciais para fazer login:

- **Email:** `admin@prismatech.com`
- **Senha:** `#serverprisma@dti`

## 🗄️ Informações do Banco de Dados

- **Host:** localhost
- **Porta:** 5432
- **Database:** rapidflow
- **Usuário:** postgres
- **Senha:** 242036

## 📍 Estrutura de Diretórios

```
C:\projetos\RapidFlow\
├── backend\              # Servidor Node.js + API
│   ├── src\             # Código-fonte
│   ├── migrations\      # Migrações do banco
│   ├── .env            # Configurações (NÃO commitado)
│   └── package.json
├── frontend\            # Interface web (se disponível)
└── setup-completo-windows.ps1  # Script de instalação
```

## 🛠️ Comandos Úteis

### Desenvolvimento

```powershell
# Iniciar em modo desenvolvimento (auto-reload)
npm run dev

# Iniciar em modo produção
npm start

# Resetar banco de dados
npm run reset-db
```

### Banco de Dados

```powershell
# Verificar se PostgreSQL está rodando
Get-Service postgresql-x64-16

# Iniciar PostgreSQL (se parado)
Start-Service postgresql-x64-16

# Conectar ao banco via psql
psql -U postgres -d rapidflow

# Resetar completamente o banco
.\setup-database-windows.ps1
```

### Git

```powershell
# Atualizar código do repositório
git pull origin main

# Ver status das alterações
git status

# Ver branch atual
git branch
```

## 🔍 Solução de Problemas

### Erro: "psql não é reconhecido como comando"

O PostgreSQL não está no PATH. Adicione manualmente:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\16\bin"
```

Ou adicione permanentemente:
1. Painel de Controle → Sistema → Variáveis de Ambiente
2. Adicione `C:\Program Files\PostgreSQL\16\bin` ao PATH

### Erro: "Não foi possível conectar ao PostgreSQL"

1. Verifique se o serviço está rodando:
   ```powershell
   Get-Service postgresql-x64-16
   ```

2. Se estiver parado, inicie:
   ```powershell
   Start-Service postgresql-x64-16
   ```

3. Verifique a senha no arquivo `.env`

### Erro: "Cannot find module"

Reinstale as dependências:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Erro: "Port 5000 already in use"

Outro processo está usando a porta 5000. Mude a porta no `.env`:

```env
PORT=5001
```

Ou mate o processo que está usando a porta:

```powershell
# Encontrar o processo
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess

# Matar o processo (substitua PID pelo número encontrado)
Stop-Process -Id PID
```

### Erro de permissão ao executar scripts PowerShell

Execute temporariamente:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## 🌐 Acessando o Sistema

Após iniciar o servidor:

- **Backend API:** http://localhost:5000
- **Frontend:** (se configurado) http://localhost:3000

## 📞 Suporte

- **Issues:** https://github.com/MoysesTI/RapidFlow/issues
- **Documentação:** https://github.com/MoysesTI/RapidFlow/wiki

## 🔄 Atualizando o Sistema

Para atualizar para a versão mais recente:

```powershell
cd C:\projetos\RapidFlow
git pull origin main
cd backend
npm install
npm run reset-db  # Se houver novas migrações
npm start
```

## 🎉 Pronto!

Seu sistema RapidFlow está configurado e pronto para usar!

Para qualquer dúvida, consulte a documentação ou abra uma issue no GitHub.
