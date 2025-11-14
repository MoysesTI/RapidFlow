# 🔄 Como Resetar o Banco de Dados

## Método Simples (PowerShell)

### 1️⃣ Opção 1: Script Automático (RECOMENDADO)

Abra o PowerShell na pasta `backend` e execute:

```powershell
.\reset-database.ps1
```

### 2️⃣ Opção 2: Comandos Manuais

Se preferir fazer manualmente, execute os comandos abaixo no PowerShell:

```powershell
# Definir senha do PostgreSQL
$env:PGPASSWORD = "docker"

# Dropar banco existente
psql -U docker -h localhost -p 5432 -d postgres -c "DROP DATABASE IF EXISTS rapidflow_db;"

# Criar novo banco
psql -U docker -h localhost -p 5432 -d postgres -c "CREATE DATABASE rapidflow_db;"

# Executar migrations
psql -U docker -h localhost -p 5432 -d rapidflow_db -f migrations\001_schema.sql
psql -U docker -h localhost -p 5432 -d rapidflow_db -f migrations\002_add_contacts_column.sql
psql -U docker -h localhost -p 5432 -d rapidflow_db -f migrations\003_campaign_logs.sql
psql -U docker -h localhost -p 5432 -d rapidflow_db -f migrations\004_campaign_events.sql
psql -U docker -h localhost -p 5432 -d rapidflow_db -f migrations\005_custom_campaigns.sql

# Limpar senha
$env:PGPASSWORD = $null
```

### 3️⃣ Verificar se funcionou

Depois de resetar, inicie o servidor:

```powershell
npm start
```

## 📋 Credenciais Padrão

Após o reset, use estas credenciais para login:

- **Email:** admin@prismatech.com
- **Senha:** #serverprisma@dti

## ⚠️ Requisitos

- PostgreSQL instalado
- Comando `psql` disponível no PATH do Windows

### Como adicionar psql ao PATH:

1. Encontre a pasta de instalação do PostgreSQL (geralmente `C:\Program Files\PostgreSQL\16\bin`)
2. Adicione ao PATH do sistema:
   - Pesquise "variáveis de ambiente" no Windows
   - Clique em "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path"
   - Clique em "Editar" e adicione o caminho do bin do PostgreSQL

## 🐳 Usando Docker (Alternativa)

Se estiver usando PostgreSQL no Docker:

```powershell
# Parar container existente
docker stop rapidflow-postgres

# Remover container e volume
docker rm rapidflow-postgres
docker volume rm rapidflow-postgres-data

# Criar novo container
docker run --name rapidflow-postgres `
  -e POSTGRES_USER=docker `
  -e POSTGRES_PASSWORD=docker `
  -e POSTGRES_DB=rapidflow_db `
  -p 5432:5432 `
  -v rapidflow-postgres-data:/var/lib/postgresql/data `
  -d postgres:16

# Aguardar o PostgreSQL iniciar
Start-Sleep -Seconds 5

# Executar migrations
docker exec -i rapidflow-postgres psql -U docker -d rapidflow_db < migrations\001_schema.sql
docker exec -i rapidflow-postgres psql -U docker -d rapidflow_db < migrations\002_add_contacts_column.sql
docker exec -i rapidflow-postgres psql -U docker -d rapidflow_db < migrations\003_campaign_logs.sql
docker exec -i rapidflow-postgres psql -U docker -d rapidflow_db < migrations\004_campaign_events.sql
docker exec -i rapidflow-postgres psql -U docker -d rapidflow_db < migrations\005_custom_campaigns.sql
```
