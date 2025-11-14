# 🚀 RapidFlow v3.0 - Setup Direto no PowerShell (C:\boot)

## ⚡ INSTALAÇÃO COMPLETA - COPIE E COLE NO POWERSHELL

### **1️⃣ CLONAR E CONFIGURAR TUDO (UM ÚNICO COMANDO)**

Abra o PowerShell como **Administrador** e cole este comando completo:

```powershell
# ═══════════════════════════════════════════════════════════
# RAPIDFLOW v3.0 - INSTALAÇÃO AUTOMÁTICA EM C:\boot
# ═══════════════════════════════════════════════════════════
cd C:\boot; if (!(Test-Path "C:\boot")) { New-Item -ItemType Directory -Path "C:\boot" -Force }; git clone https://github.com/MoysesTI/RapidFlow.git; cd RapidFlow; Copy-Item "backend\.env.example" "backend\.env" -ErrorAction SilentlyContinue; if (!(Test-Path "backend\.env")) { @"
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=242036
DB_SSL=false
JWT_SECRET=rapidflow_local_secret_key_development_2025_ultra_secure_token
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=#serverprisma@dti
DEFAULT_WEBHOOK_URL=http://localhost:5678/webhook/prisma
DEFAULT_EVOLUTION_ENDPOINT=https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem
DEFAULT_EVOLUTION_API_KEY=YOUR_KEY_HERE
DEFAULT_OPENAI_API_KEY=sk-your-key-here
DEFAULT_OPENAI_MODEL=gpt-4o-mini
"@ | Out-File "backend\.env" -Encoding UTF8 }; cd backend; npm install; cd ..; Write-Host "✅ RapidFlow clonado em C:\boot\RapidFlow" -ForegroundColor Green
```

---

### **2️⃣ CRIAR BANCO DE DADOS**

```powershell
# Criar banco e executar migrations
$env:PGPASSWORD="242036"; psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS rapidflow"; psql -U postgres -h localhost -c "CREATE DATABASE rapidflow"; cd C:\boot\RapidFlow; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql; psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql 2>$null; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql 2>$null; $env:PGPASSWORD=$null; Write-Host "✅ Banco 'rapidflow' criado e configurado" -ForegroundColor Green
```

---

### **3️⃣ INICIAR BACKEND**

```powershell
# Iniciar o servidor backend
cd C:\boot\RapidFlow\backend; npm start
```

---

### **4️⃣ ABRIR FRONTEND (em outra janela PowerShell)**

```powershell
# Abrir frontend no navegador
Start-Process "chrome" "file:///C:/boot/RapidFlow/frontend/login.html" -ErrorAction SilentlyContinue; if ($LASTEXITCODE -ne 0) { Start-Process "msedge" "file:///C:/boot/RapidFlow/frontend/login.html" -ErrorAction SilentlyContinue }; Write-Host "✅ Frontend aberto no navegador" -ForegroundColor Green
```

---

## 🎯 **COMANDOS ÚTEIS - COPIE E COLE**

### **Testar Health Check**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" | ConvertTo-Json
```

### **Fazer Login**
```powershell
$loginBody = @{ email = "admin@prismatech.com"; password = "#serverprisma@dti" } | ConvertTo-Json; $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"; Write-Host "✅ Token: $($response.token.Substring(0,50))..." -ForegroundColor Green; $global:token = $response.token
```

### **Listar Campanhas (após login)**
```powershell
$headers = @{ Authorization = "Bearer $global:token" }; Invoke-RestMethod -Uri "http://localhost:5000/api/campaigns" -Headers $headers | ConvertTo-Json
```

### **Ver Logs do Sistema (PostgreSQL)**
```powershell
$env:PGPASSWORD="242036"; psql -U postgres -h localhost -d rapidflow -c "SELECT log_level, log_type, message, created_at FROM system_logs ORDER BY created_at DESC LIMIT 10"; $env:PGPASSWORD=$null
```

### **Ver Resumo de Campanhas**
```powershell
$env:PGPASSWORD="242036"; psql -U postgres -h localhost -d rapidflow -c "SELECT * FROM v_campaigns_summary"; $env:PGPASSWORD=$null
```

### **Limpar Todos os Logs**
```powershell
$env:PGPASSWORD="242036"; psql -U postgres -h localhost -d rapidflow -c "TRUNCATE TABLE system_logs, campaign_messages, n8n_events RESTART IDENTITY"; $env:PGPASSWORD=$null; Write-Host "✅ Logs limpos" -ForegroundColor Green
```

---

## 🔧 **CONFIGURAR SUAS CHAVES DE API**

```powershell
# Abrir editor do .env
notepad C:\boot\RapidFlow\backend\.env
```

Edite estas linhas:
```env
DEFAULT_EVOLUTION_API_KEY=sua_chave_evolution_aqui
DEFAULT_OPENAI_API_KEY=sk-sua-chave-openai-aqui
```

Depois reinicie o backend.

---

## 🧪 **TESTES COMPLETOS - UM COMANDO**

```powershell
# Executar todos os testes
cd C:\boot\RapidFlow; Write-Host "`n🧪 TESTANDO RAPIDFLOW v3.0`n" -ForegroundColor Magenta; Write-Host "1️⃣ Health Check..." -ForegroundColor Cyan; try { $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 5; Write-Host "✅ Backend OK - $($health.version)" -ForegroundColor Green } catch { Write-Host "❌ Backend offline" -ForegroundColor Red }; Write-Host "`n2️⃣ PostgreSQL..." -ForegroundColor Cyan; $env:PGPASSWORD="242036"; try { $dbTest = psql -U postgres -h localhost -d rapidflow -tAc "SELECT COUNT(*) FROM users" 2>$null; Write-Host "✅ Banco OK - $dbTest usuários" -ForegroundColor Green } catch { Write-Host "❌ Banco offline" -ForegroundColor Red }; $env:PGPASSWORD=$null; Write-Host "`n3️⃣ Login..." -ForegroundColor Cyan; try { $loginBody = @{ email = "admin@prismatech.com"; password = "#serverprisma@dti" } | ConvertTo-Json; $loginResp = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 5; Write-Host "✅ Login OK - Token recebido" -ForegroundColor Green; $global:testToken = $loginResp.token } catch { Write-Host "❌ Login falhou" -ForegroundColor Red }; Write-Host ""
```

---

## 🔄 **RECRIAR BANCO DO ZERO**

```powershell
# Dropar, recriar e executar todas as migrations
$env:PGPASSWORD="242036"; psql -U postgres -h localhost -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='rapidflow' AND pid <> pg_backend_pid()" 2>$null; psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS rapidflow"; psql -U postgres -h localhost -c "CREATE DATABASE rapidflow"; cd C:\boot\RapidFlow; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql; psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql 2>$null; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql 2>$null; $env:PGPASSWORD=$null; Write-Host "✅ Banco recriado do zero" -ForegroundColor Green
```

---

## 📊 **VER STATUS COMPLETO DO SISTEMA**

```powershell
# Status completo
Write-Host "`n═══════════════════════════════════════════" -ForegroundColor Magenta; Write-Host "   RAPIDFLOW v3.0 - STATUS DO SISTEMA" -ForegroundColor Magenta; Write-Host "═══════════════════════════════════════════`n" -ForegroundColor Magenta; Write-Host "📁 Diretório: " -NoNewline; if (Test-Path "C:\boot\RapidFlow") { Write-Host "C:\boot\RapidFlow ✅" -ForegroundColor Green } else { Write-Host "NÃO ENCONTRADO ❌" -ForegroundColor Red }; Write-Host "📦 node_modules: " -NoNewline; if (Test-Path "C:\boot\RapidFlow\backend\node_modules") { Write-Host "OK ✅" -ForegroundColor Green } else { Write-Host "FALTANDO ❌" -ForegroundColor Red }; Write-Host "⚙️  .env: " -NoNewline; if (Test-Path "C:\boot\RapidFlow\backend\.env") { Write-Host "OK ✅" -ForegroundColor Green } else { Write-Host "FALTANDO ❌" -ForegroundColor Red }; Write-Host "🌐 Backend: " -NoNewline; try { Invoke-RestMethod -Uri "http://localhost:5000/health" -TimeoutSec 2 | Out-Null; Write-Host "ONLINE ✅" -ForegroundColor Green } catch { Write-Host "OFFLINE ❌" -ForegroundColor Red }; Write-Host "🗄️  PostgreSQL: " -NoNewline; $env:PGPASSWORD="242036"; try { psql -U postgres -h localhost -d rapidflow -c "SELECT 1" 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { Write-Host "CONECTADO ✅" -ForegroundColor Green } else { Write-Host "ERRO ❌" -ForegroundColor Red } } catch { Write-Host "OFFLINE ❌" -ForegroundColor Red }; $env:PGPASSWORD=$null; Write-Host ""
```

---

## 🗑️ **REMOVER TUDO**

```powershell
# Parar backend, dropar banco, remover diretório
Get-Job | Stop-Job 2>$null; Get-Job | Remove-Job 2>$null; $env:PGPASSWORD="242036"; psql -U postgres -h localhost -c "DROP DATABASE IF EXISTS rapidflow" 2>$null; $env:PGPASSWORD=$null; Set-Location C:\; Remove-Item -Path "C:\boot\RapidFlow" -Recurse -Force -ErrorAction SilentlyContinue; Write-Host "✅ RapidFlow removido completamente" -ForegroundColor Green
```

---

## 📝 **ATALHOS RÁPIDOS**

### **Setup Completo (Tudo de uma vez)**
```powershell
cd C:\boot; if (!(Test-Path "C:\boot")) { mkdir C:\boot }; git clone https://github.com/MoysesTI/RapidFlow.git 2>$null; cd RapidFlow; if (!(Test-Path "backend\.env")) { @"
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=242036
DB_SSL=false
JWT_SECRET=rapidflow_local_secret_key_development_2025_ultra_secure_token
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=#serverprisma@dti
"@ | Out-File "backend\.env" -Encoding UTF8 }; cd backend; npm install; cd ..; $env:PGPASSWORD="242036"; psql -U postgres -h localhost -c "CREATE DATABASE rapidflow" 2>$null; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql 2>$null; psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql 2>$null; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_add_contacts_column.sql 2>$null; $env:PGPASSWORD=$null; Write-Host "`n✅ SETUP COMPLETO! Inicie com: cd C:\boot\RapidFlow\backend; npm start" -ForegroundColor Green
```

### **Iniciar Backend**
```powershell
cd C:\boot\RapidFlow\backend; npm start
```

### **Abrir Frontend**
```powershell
Start-Process "chrome" "file:///C:/boot/RapidFlow/frontend/login.html" 2>$null
```

---

## 🔐 **CREDENCIAIS**

### **Aplicação:**
- Email: `admin@prismatech.com`
- Senha: `#serverprisma@dti`

### **Banco de Dados:**
- Host: `localhost`
- Porta: `5432`
- Database: `rapidflow`
- Usuário: `postgres`
- Senha: `242036`

---

## 🌐 **URLs**

- **Frontend:** `file:///C:/boot/RapidFlow/frontend/login.html`
- **Backend:** `http://localhost:5000`
- **Health:** `http://localhost:5000/health`
- **API Docs:** `http://localhost:5000/api`

---

## ✅ **FLUXO COMPLETO EM 3 PASSOS**

```powershell
# 1. Setup (uma vez só)
cd C:\boot; git clone https://github.com/MoysesTI/RapidFlow.git; cd RapidFlow; Copy-Item "backend\.env.example" "backend\.env" -ErrorAction SilentlyContinue; cd backend; npm install; cd ..; $env:PGPASSWORD="242036"; psql -U postgres -h localhost -c "CREATE DATABASE rapidflow" 2>$null; psql -U postgres -h localhost -d rapidflow -f backend/migrations/001_schema.sql; psql -U postgres -h localhost -d rapidflow -f backend/migrations/002_enhanced_logging_system.sql 2>$null; $env:PGPASSWORD=$null

# 2. Iniciar backend
cd C:\boot\RapidFlow\backend; npm start

# 3. Abrir frontend (nova janela PowerShell)
Start-Process "chrome" "file:///C:/boot/RapidFlow/frontend/login.html"
```

---

**Tudo executável direto no PowerShell sem criar arquivos! 🚀**
