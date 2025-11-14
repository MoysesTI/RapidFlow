# 🤖 CLAUDE.md - AI Assistant Guide for RapidFlow

> **Last Updated:** 2025-11-14
> **Version:** 2.3.0
> **Purpose:** Comprehensive guide for AI assistants working on the RapidFlow codebase

---

## 📋 TABLE OF CONTENTS

1. [Project Overview](#project-overview)
2. [Codebase Architecture](#codebase-architecture)
3. [Technology Stack](#technology-stack)
4. [Development Workflows](#development-workflows)
5. [Coding Conventions](#coding-conventions)
6. [Security Requirements](#security-requirements)
7. [Common Patterns](#common-patterns)
8. [File Structure Reference](#file-structure-reference)
9. [Database Schema](#database-schema)
10. [API Reference](#api-reference)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Guide](#deployment-guide)
13. [Common Pitfalls](#common-pitfalls)
14. [Troubleshooting](#troubleshooting)

---

## 🎯 PROJECT OVERVIEW

**RapidFlow** is a full-stack mass messaging automation system for WhatsApp campaigns with AI-powered personalization.

### Key Features
- **Batch Messaging**: Process thousands of messages automatically
- **AI Personalization**: Generate unique messages with OpenAI GPT-4
- **WhatsApp Integration**: Direct connection via Evolution API
- **Real-time Dashboard**: Campaign monitoring and metrics
- **Multi-tenant**: User management with JWT authentication
- **Audit Logging**: Complete campaign tracking

### Core Technologies
- **Backend**: Node.js 18+ / Express.js / PostgreSQL 15+
- **Frontend**: Vanilla JavaScript (ES6+) / HTML5 / CSS3
- **Authentication**: JWT + bcrypt
- **External APIs**: Evolution API (WhatsApp), OpenAI, n8n workflows

---

## 🏗️ CODEBASE ARCHITECTURE

### High-Level Architecture

```
┌─────────────┐      HTTP/REST      ┌──────────────┐      SQL       ┌──────────────┐
│   Frontend  │ ◄─────────────────► │   Backend    │ ◄────────────► │  PostgreSQL  │
│  (Vanilla)  │    JWT Auth         │  (Express)   │   Pooled Conn  │   Database   │
└─────────────┘                     └──────────────┘                └──────────────┘
                                           │
                                           ▼
                                    ┌──────────────┐
                                    │   n8n        │
                                    │  Workflow    │ ──────► Evolution API ──► WhatsApp
                                    └──────────────┘              │
                                                                  ▼
                                                            OpenAI GPT-4
```

### Backend Architecture (MVC Pattern)

```
backend/src/
├── config/
│   └── database.js           # PostgreSQL pool (Singleton)
├── controllers/              # Business logic layer
│   ├── authController.js     # User registration, login, JWT
│   ├── campaignController.js # Campaign CRUD, file uploads
│   └── configController.js   # User API configurations
├── middleware/
│   └── auth.js              # JWT verification middleware
├── routes/                  # API endpoint definitions
│   ├── auth.js             # /api/auth/*
│   ├── campaigns.js        # /api/campaigns/*
│   └── config.js           # /api/config/*
├── utils/
│   └── fileParser.js       # CSV/Excel parsing logic
├── server.js               # Express app + middleware chain
├── auto-migration.js       # Automatic DB schema setup
└── seed.js                 # Manual database seeding
```

### Frontend Architecture (SPA)

```
frontend/
├── css/
│   ├── style.css           # Global styles
│   └── login.css           # Login-specific styles
├── js/
│   ├── api.js             # ApiClient class (Singleton)
│   ├── auth.js            # Login/register logic
│   └── script.js          # Main dashboard logic
├── src/pages/
│   └── Settings.jsx       # Settings component (React-like)
├── index.html             # Main dashboard (protected)
└── login.html             # Public login page
```

**State Management:**
- `localStorage`: JWT token, user data persistence
- DOM manipulation: Campaign state, progress updates
- Global `api` instance: Centralized HTTP client

---

## 💻 TECHNOLOGY STACK

### Backend Dependencies (backend/package.json)

| Package | Version | Purpose |
|---------|---------|---------|
| express | 4.18.2 | Web framework |
| pg | 8.11.3 | PostgreSQL driver |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcrypt | 5.1.1 | Password hashing |
| helmet | 7.1.0 | Security headers |
| cors | 2.8.5 | CORS middleware |
| express-rate-limit | 7.1.5 | Rate limiting |
| express-validator | 7.0.1 | Input validation |
| multer | 1.4.5 | File upload handling |
| xlsx | 0.18.5 | Excel file parsing |
| csv-parser | 3.0.0 | CSV file parsing |
| axios | 1.13.2 | HTTP client (webhooks) |
| compression | 1.7.4 | Response compression |
| morgan | 1.10.0 | HTTP request logging |
| dotenv | 16.3.1 | Environment variables |

### Frontend Stack

- **Pure JavaScript**: No frameworks (no React/Vue/Angular)
- **ES6+ Features**: Async/await, classes, modules
- **Fetch API**: HTTP requests
- **LocalStorage API**: Client-side persistence
- **Google Fonts**: Inter family (300, 400, 500, 600)

### Database

- **PostgreSQL 15+**: Primary database
- **Extensions**: uuid-ossp (UUID generation)
- **Connection Pooling**: Max 20 connections, 30s idle timeout
- **SSL Mode**: Required in production (Render), disabled verification for webhooks

---

## 🔄 DEVELOPMENT WORKFLOWS

### 1. Local Development Setup

```bash
# Clone repository
git clone https://github.com/MoysesTI/RapidFlow.git
cd RapidFlow

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with local credentials

# Database setup (PostgreSQL must be running)
createdb rapidflow
# Auto-migration runs on first server start

# Start backend (port 5000)
npm run dev  # Uses nodemon for auto-reload

# Frontend setup (separate terminal)
cd ../frontend
npx http-server -p 3000

# Access application
# Frontend: http://localhost:3000/login.html
# Backend API: http://localhost:5000
# Health check: http://localhost:5000/health
```

### 2. Git Workflow

**Branch Strategy:**
- `main`: Production-ready code
- `claude/*`: AI assistant feature branches (auto-generated)
- Feature branches: `feature/feature-name`
- Bug fixes: `fix/bug-description`

**Commit Message Convention:**
```bash
# Format: <type>: <description>

# Types:
feat:     # New feature
fix:      # Bug fix
security: # Security improvement
refactor: # Code refactoring
docs:     # Documentation changes
test:     # Adding tests
chore:    # Maintenance tasks

# Examples:
git commit -m "feat: Add AI message personalization"
git commit -m "fix: Resolve CORS configuration issues"
git commit -m "security: Implement rate limiting on auth endpoints"
```

### 3. Making Changes

**Before Starting:**
1. Check if CLAUDE.md exists (you're reading it!)
2. Review recent commits: `git log --oneline -10`
3. Check current branch: `git status`
4. Read relevant controller/route files

**Development Process:**
1. **Read before Edit**: ALWAYS read existing files before modifying
2. **Test locally**: Run server and verify changes
3. **Check security**: Review SECURITY.md guidelines
4. **Commit atomically**: One logical change per commit
5. **Push to feature branch**: Never push directly to `main`

### 4. Database Migrations

**Automatic Migration:**
- Runs on server startup (auto-migration.js)
- Idempotent: Safe to run multiple times
- Creates schema + default admin user

**Manual Migration (if needed):**
```bash
# Connect to database
psql -U postgres -d rapidflow

# Run migration SQL
\i backend/migrations/001_schema.sql

# Verify tables
\dt
```

**Adding New Migrations:**
1. Create `backend/migrations/002_your_migration.sql`
2. Update auto-migration.js to detect and run new migrations
3. Test on clean database
4. Document in commit message

---

## 📝 CODING CONVENTIONS

### General Rules

1. **Language**: Code in English, comments/messages in **Portuguese (PT-BR)**
2. **Async/Await**: ALWAYS use async/await, NEVER use raw Promises
3. **Error Handling**: Every async function must have try-catch
4. **Consistent Responses**: Follow API response format (see below)
5. **SQL Injection Prevention**: ALWAYS use parameterized queries ($1, $2, etc.)
6. **No Hardcoded Secrets**: Use environment variables

### Backend Conventions

#### Controller Pattern

```javascript
// ✅ GOOD: Standard controller pattern
async function controllerFunction(req, res) {
    try {
        const { param1, param2 } = req.body;

        // Validação
        if (!param1 || !param2) {
            return res.status(400).json({
                error: true,
                message: 'Parâmetros obrigatórios ausentes'
            });
        }

        // Lógica de negócio
        const result = await pool.query(
            'SELECT * FROM table WHERE field = $1',
            [param1]
        );

        // Log de auditoria (para ações importantes)
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type) VALUES ($1, $2, $3)',
            [req.user.userId, 'ACTION_NAME', 'entity_type']
        );

        res.json({
            success: true,
            message: 'Operação realizada com sucesso',
            data: result.rows
        });

    } catch (error) {
        console.error('Erro em controllerFunction:', error);
        res.status(500).json({
            error: true,
            message: 'Erro ao processar requisição'
        });
    }
}
```

#### API Response Format

```javascript
// Success Response
{
    "success": true,
    "message": "Operação realizada com sucesso",
    "data": { /* optional payload */ }
}

// Error Response
{
    "error": true,
    "message": "Descrição do erro em português"
}

// Validation Error
{
    "error": true,
    "message": "Campo obrigatório ausente",
    "field": "fieldName"  // optional
}
```

#### Database Query Patterns

```javascript
// ✅ GOOD: Parameterized query
const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
);

// ❌ BAD: String concatenation (SQL injection risk!)
const result = await pool.query(
    `SELECT * FROM users WHERE email = '${email}'`
);

// ✅ GOOD: Multiple parameters
const result = await pool.query(
    'INSERT INTO campaigns (name, user_id, status) VALUES ($1, $2, $3) RETURNING id',
    [name, userId, 'pending']
);

// ✅ GOOD: Checking if results exist
if (result.rows.length === 0) {
    return res.status(404).json({ error: true, message: 'Não encontrado' });
}
const data = result.rows[0];
```

### Frontend Conventions

#### API Client Usage

```javascript
// ✅ GOOD: Using ApiClient class
const api = new ApiClient();

try {
    const response = await api.login(email, password);
    localStorage.setItem('prismatech_token', response.token);
    localStorage.setItem('prismatech_user', JSON.stringify(response.user));
    window.location.href = '/index.html';
} catch (error) {
    showError(error.message);
}

// ✅ GOOD: Authenticated request
const campaigns = await api.getCampaigns();

// ✅ GOOD: File upload with FormData
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('name', campaignName);
const response = await api.createCampaign(formData);
```

#### DOM Manipulation

```javascript
// ✅ GOOD: Clear, descriptive selectors
const campaignList = document.getElementById('campaign-list');
const submitButton = document.querySelector('.btn-submit');

// ✅ GOOD: Event listeners with named functions
submitButton.addEventListener('click', handleSubmit);

async function handleSubmit(event) {
    event.preventDefault();
    // Logic here
}

// ✅ GOOD: Dynamic HTML generation
function renderCampaigns(campaigns) {
    const html = campaigns.map(campaign => `
        <div class="campaign-card" data-id="${campaign.id}">
            <h3>${campaign.name}</h3>
            <span class="status ${campaign.status}">${campaign.status}</span>
        </div>
    `).join('');
    campaignList.innerHTML = html;
}
```

### CSS Conventions

```css
/* Use BEM-like naming for clarity */
.campaign-card { }
.campaign-card__title { }
.campaign-card--active { }

/* Use CSS custom properties for theming */
:root {
    --primary-color: #4A90E2;
    --success-color: #28a745;
    --error-color: #dc3545;
}

/* Mobile-first responsive design */
.container {
    width: 100%;
}

@media (min-width: 768px) {
    .container {
        max-width: 1200px;
    }
}
```

---

## 🔒 SECURITY REQUIREMENTS

### Critical Security Rules

⚠️ **NEVER COMMIT THESE FILES:**
- `.env` files
- `credentials.json`
- Database backups with sensitive data
- JWT secrets
- API keys

### Environment Variables (backend/.env)

```bash
# Server
NODE_ENV=development  # or 'production'
PORT=5000
HOST=0.0.0.0

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=strong_password_here
DB_SSL=false  # true in production

# JWT (CRITICAL - MUST BE STRONG)
JWT_SECRET=minimum_32_characters_random_string
JWT_EXPIRES_IN=24h

# CORS (Whitelist specific origins)
CORS_ORIGIN=http://localhost:3000,https://yourdomain.com

# Evolution API
DEFAULT_EVOLUTION_ENDPOINT=https://your-evolution-api.com
DEFAULT_EVOLUTION_API_KEY=your_api_key

# n8n Webhook
DEFAULT_WEBHOOK_URL=https://your-n8n.com/webhook/campaign

# OpenAI (Optional)
OPENAI_API_KEY=sk-your_openai_key

# Admin Credentials (First-time setup)
ADMIN_EMAIL=admin@prismatech.com
ADMIN_PASSWORD=#serverprisma@dti
```

### Security Checklist

Before deploying or committing:

- [ ] `.env` is in `.gitignore`
- [ ] `JWT_SECRET` is 32+ characters
- [ ] `CORS_ORIGIN` only lists trusted domains
- [ ] Production uses `NODE_ENV=production`
- [ ] Database uses SSL in production (`DB_SSL=true`)
- [ ] No hardcoded credentials in code
- [ ] Rate limiting is enabled (200 req/15min)
- [ ] Helmet.js security headers are active
- [ ] Passwords are hashed with bcrypt (10 rounds)
- [ ] All database queries are parameterized

### Authentication Flow

```javascript
// JWT Payload Structure
{
    userId: number,
    email: string,
    role: 'admin' | 'user',
    iat: timestamp,
    exp: timestamp
}

// Protected Route Pattern
router.get('/protected', authenticateToken, async (req, res) => {
    // req.user contains { userId, email, role }
});

// Frontend Auth Check
if (!localStorage.getItem('prismatech_token')) {
    window.location.href = '/login.html';
}
```

### Audit Logging

**All important actions must be logged:**

```javascript
await pool.query(
    'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, details) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, 'CAMPAIGN_CREATED', 'campaign', campaignId, req.ip, JSON.stringify(metadata)]
);
```

**Standard Actions:**
- `USER_REGISTERED`, `USER_LOGIN`, `USER_LOGOUT`
- `CAMPAIGN_CREATED`, `CAMPAIGN_STARTED`, `CAMPAIGN_COMPLETED`
- `CONFIG_UPDATED`, `FILE_UPLOADED`
- `ERROR_OCCURRED` (for critical errors)

---

## 🎨 COMMON PATTERNS

### 1. File Upload Pattern

```javascript
// Controller (Memory Storage)
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.csv', '.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Formato de arquivo não suportado'));
        }
    }
});

// Route
router.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
    const fileBuffer = req.file.buffer;
    const contacts = await parseFile(fileBuffer, req.file.mimetype);
    // Process contacts...
});
```

### 2. Webhook Integration Pattern

```javascript
const axios = require('axios');
const https = require('https');

// HTTPS agent (ignores SSL for webhooks)
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

async function triggerWebhook(webhookUrl, payload) {
    try {
        const response = await axios.post(webhookUrl, payload, {
            httpsAgent,
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    } catch (error) {
        console.error('Webhook error:', error.message);
        throw error;
    }
}
```

### 3. Pagination Pattern

```javascript
// Query with pagination
async function getCampaigns(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
        'SELECT * FROM campaigns WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [req.user.userId, limit, offset]
    );

    const countResult = await pool.query(
        'SELECT COUNT(*) FROM campaigns WHERE user_id = $1',
        [req.user.userId]
    );

    res.json({
        success: true,
        data: result.rows,
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(countResult.rows[0].count / limit)
        }
    });
}
```

### 4. Progress Tracking Pattern

```javascript
// Update campaign progress
async function updateCampaignProgress(campaignId, sent, total) {
    await pool.query(
        'UPDATE campaigns SET messages_sent = $1, total_contacts = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [sent, total, campaignId]
    );
}

// Update contact status
async function updateContactStatus(contactId, status, errorMessage = null) {
    await pool.query(
        'UPDATE campaign_contacts SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, errorMessage, contactId]
    );
}
```

---

## 📁 FILE STRUCTURE REFERENCE

### Backend Critical Files

| File Path | Purpose | Lines | Key Functions |
|-----------|---------|-------|---------------|
| `backend/src/server.js` | Main entry point | 219 | App initialization, middleware chain, error handlers |
| `backend/src/config/database.js` | DB connection pool | 26 | PostgreSQL pool singleton |
| `backend/src/auto-migration.js` | Auto DB setup | 51 | runMigration(), creates schema + admin user |
| `backend/src/controllers/authController.js` | Authentication | 202 | register(), login(), verifyAuth() |
| `backend/src/controllers/campaignController.js` | Campaign logic | 189 | createCampaign(), getCampaigns(), startCampaign() |
| `backend/src/controllers/configController.js` | User configs | 95 | getConfig(), updateConfig() |
| `backend/src/middleware/auth.js` | JWT verification | 35 | authenticateToken() |
| `backend/src/utils/fileParser.js` | File parsing | 125 | parseCSV(), parseExcel() |
| `backend/migrations/001_schema.sql` | Database schema | 102 | All table definitions |

### Frontend Critical Files

| File Path | Purpose | Lines | Key Features |
|-----------|---------|-------|--------------|
| `frontend/js/api.js` | API client class | 146 | ApiClient, all API methods |
| `frontend/js/auth.js` | Login/register | ~150 | Form handling, validation |
| `frontend/js/script.js` | Main dashboard | ~800 | Campaign CRUD, progress tracking |
| `frontend/index.html` | Dashboard page | ~250 | Protected route, main UI |
| `frontend/login.html` | Login page | ~150 | Public route, auth forms |
| `frontend/css/style.css` | Main styles | ~500 | Dashboard, campaigns, responsive |

### Configuration Files

| File Path | Purpose |
|-----------|---------|
| `backend/package.json` | Backend dependencies, npm scripts |
| `backend/.env.example` | Environment variables template (47 lines) |
| `render.yaml` | Render.com deployment config |
| `.gitignore` | Excludes .env, node_modules, credentials |
| `SECURITY.md` | Security guidelines and checklist |
| `README.md` | Project documentation (Portuguese) |
| `n8n-workflow-fixed.json` | n8n automation workflow definition |

---

## 🗄️ DATABASE SCHEMA

### Tables Overview

```sql
users               -- User accounts
user_configs        -- Per-user API configurations (1:1)
campaigns           -- Campaign metadata
campaign_contacts   -- Individual contact records (1:N)
audit_logs          -- Activity tracking
```

### Complete Schema

#### 1. users

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user',  -- 'admin' or 'user'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### 2. user_configs

```sql
CREATE TABLE user_configs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    webhook_url TEXT,
    evolution_endpoint TEXT,
    evolution_api_key TEXT,
    ai_config JSONB,  -- OpenAI settings
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_configs_user_id ON user_configs(user_id);
```

#### 3. campaigns

```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, running, completed, failed
    total_contacts INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    contacts JSONB,  -- Contact list data
    config JSONB,    -- Campaign-specific settings
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
```

#### 4. campaign_contacts

```sql
CREATE TABLE campaign_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',  -- pending, sent, failed
    message_sent TEXT,
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contacts_campaign_id ON campaign_contacts(campaign_id);
CREATE INDEX idx_contacts_status ON campaign_contacts(status);
```

#### 5. audit_logs

```sql
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    ip_address VARCHAR(45),
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Helper Functions

```sql
-- Normalize phone numbers (remove formatting)
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

---

## 🌐 API REFERENCE

### Base URL

- **Local**: `http://localhost:5000/api`
- **Production**: `https://rapidflow-backend.onrender.com/api`

### Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer <token>
```

### Endpoints

#### Authentication (`/api/auth`)

```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "string",
    "email": "string",
    "password": "string",  // min 6 chars
    "firstName": "string",
    "lastName": "string",
    "phone": "string"      // optional
}

Response: 201
{
    "success": true,
    "message": "Usuário cadastrado com sucesso!",
    "user": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "firstName": "string",
        "lastName": "string"
    }
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
    "email": "string",
    "password": "string"
}

Response: 200
{
    "success": true,
    "message": "Login realizado com sucesso!",
    "token": "jwt_token_string",
    "user": {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "firstName": "string",
        "lastName": "string",
        "role": "user|admin"
    }
}
```

```http
GET /api/auth/verify
Authorization: Bearer <token>

Response: 200
{
    "success": true,
    "user": { ...user_object }
}
```

#### Campaigns (`/api/campaigns`)

```http
GET /api/campaigns
Authorization: Bearer <token>
Query: ?page=1&limit=20

Response: 200
{
    "success": true,
    "data": [
        {
            "id": "uuid",
            "name": "string",
            "status": "pending|running|completed|failed",
            "total_contacts": number,
            "messages_sent": number,
            "messages_failed": number,
            "created_at": "timestamp"
        }
    ]
}
```

```http
POST /api/campaigns
Authorization: Bearer <token>
Content-Type: multipart/form-data

FormData:
- file: File (CSV or Excel)
- name: string
- message: string (template with {{name}} placeholder)
- delay: number (milliseconds between messages)
- evolutionEndpoint: string (optional)
- evolutionApiKey: string (optional)

Response: 201
{
    "success": true,
    "message": "Campanha criada com sucesso!",
    "data": {
        "id": "uuid",
        "name": "string",
        "total_contacts": number
    }
}
```

```http
GET /api/campaigns/:id
Authorization: Bearer <token>

Response: 200
{
    "success": true,
    "data": {
        "campaign": { ...campaign_object },
        "contacts": [ ...contact_objects ]
    }
}
```

```http
POST /api/campaigns/:id/start
Authorization: Bearer <token>

Response: 200
{
    "success": true,
    "message": "Campanha iniciada com sucesso!"
}
```

#### Configuration (`/api/config`)

```http
GET /api/config
Authorization: Bearer <token>

Response: 200
{
    "success": true,
    "data": {
        "webhook_url": "string",
        "evolution_endpoint": "string",
        "evolution_api_key": "string",
        "ai_config": { ...jsonb }
    }
}
```

```http
PUT /api/config
Authorization: Bearer <token>
Content-Type: application/json

{
    "webhook_url": "string",
    "evolution_endpoint": "string",
    "evolution_api_key": "string",
    "ai_config": { ...object }
}

Response: 200
{
    "success": true,
    "message": "Configuração atualizada com sucesso!"
}
```

#### Health Check

```http
GET /health

Response: 200
{
    "status": "ok",
    "version": "2.3.0",
    "timestamp": "2025-11-14T12:00:00.000Z",
    "database": "connected",
    "environment": "production|development"
}
```

---

## 🧪 TESTING STRATEGY

### Current State

**No automated testing framework is currently implemented.**

### Manual Testing Approach

1. **Health Check**: `GET /health` - Verify server is running
2. **Database Connection**: Check server logs for "✅ Database conectado com sucesso"
3. **Authentication Flow**:
   - Register new user
   - Login with credentials
   - Verify token works on protected endpoints
4. **Campaign Creation**:
   - Upload CSV/Excel file
   - Verify contacts are parsed correctly
   - Check database records

### Testing Checklist for Changes

When modifying code, test:

- [ ] Server starts without errors
- [ ] Database migrations run successfully
- [ ] Affected endpoints return expected responses
- [ ] Error handling works (invalid inputs, missing auth, etc.)
- [ ] CORS headers are present
- [ ] Rate limiting works (if testing auth endpoints)
- [ ] Frontend UI updates correctly
- [ ] LocalStorage persistence works
- [ ] No console errors in browser

### Recommended Testing Setup (Future)

```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Add to package.json
{
    "scripts": {
        "test": "jest",
        "test:watch": "jest --watch"
    }
}

# Create backend/tests/ directory
backend/tests/
├── auth.test.js
├── campaigns.test.js
└── config.test.js
```

---

## 🚀 DEPLOYMENT GUIDE

### Render.com Deployment (Recommended)

#### Prerequisites
- GitHub repository
- Render.com account (free tier available)

#### Backend Deployment

1. **Create PostgreSQL Database:**
   - Dashboard → New → PostgreSQL
   - Choose free tier
   - Note the "Internal Database URL"

2. **Create Web Service:**
   - Dashboard → New → Web Service
   - Connect GitHub repository
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
   - **Branch**: `main`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   HOST=0.0.0.0
   DB_HOST=<from_internal_url>
   DB_PORT=5432
   DB_NAME=<database_name>
   DB_USER=<database_user>
   DB_PASSWORD=<from_internal_url>
   DB_SSL=true
   JWT_SECRET=<generate_random_32+_chars>
   JWT_EXPIRES_IN=24h
   CORS_ORIGIN=https://your-frontend.onrender.com
   DEFAULT_EVOLUTION_ENDPOINT=<your_evolution_api>
   DEFAULT_EVOLUTION_API_KEY=<your_api_key>
   DEFAULT_WEBHOOK_URL=<your_n8n_webhook>
   ADMIN_EMAIL=admin@prismatech.com
   ADMIN_PASSWORD=#serverprisma@dti
   ```

4. **Deploy**: Click "Create Web Service"
   - Auto-migration runs on first start
   - Health check: `https://your-app.onrender.com/health`

#### Frontend Deployment

1. **Create Static Site:**
   - Dashboard → New → Static Site
   - Connect same GitHub repository
   - **Publish Directory**: `frontend`
   - **Build Command**: (leave empty)

2. **Environment Variables:**
   ```
   API_URL=https://your-backend.onrender.com/api
   ```

3. **Update frontend/js/api.js:**
   ```javascript
   const API_URL = 'https://your-backend.onrender.com/api';
   ```

4. **Deploy**: Push to GitHub → Auto-deploy

### Alternative: Vercel (Frontend) + Render (Backend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd frontend
vercel

# Follow prompts
# Update API_URL in api.js to backend URL
```

### Deployment Checklist

Before deploying:

- [ ] `.env.example` is updated with all variables
- [ ] No `.env` file in repository
- [ ] `CORS_ORIGIN` matches frontend domain
- [ ] `JWT_SECRET` is 32+ random characters
- [ ] Database SSL is enabled (`DB_SSL=true`)
- [ ] Admin credentials are changed from defaults
- [ ] API keys are valid and active
- [ ] Health check endpoint returns "ok"
- [ ] Auto-migration creates all tables

After deploying:

- [ ] Test `/health` endpoint
- [ ] Login with admin credentials
- [ ] Create test campaign
- [ ] Check database has records
- [ ] Verify CORS works (no browser errors)
- [ ] Test file upload
- [ ] Monitor logs for errors

---

## ⚠️ COMMON PITFALLS

### 1. CORS Issues

**Problem**: Frontend gets "CORS policy" errors

**Solution:**
```javascript
// backend/src/server.js
const allowedOrigins = process.env.CORS_ORIGIN.split(',');
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
```

**Check:**
- `CORS_ORIGIN` env variable is set
- Frontend domain is in the whitelist
- No trailing slashes in URLs

### 2. Database Connection Fails

**Problem**: "ECONNREFUSED" or "Connection timeout"

**Solutions:**
- **Local**: PostgreSQL service not running
  ```bash
  sudo service postgresql start  # Linux
  brew services start postgresql # macOS
  ```
- **Render**: Wrong `DB_HOST` (use internal URL, not external)
- **SSL**: Set `DB_SSL=true` in production, `false` locally

### 3. JWT Token Invalid

**Problem**: "Invalid token" on protected routes

**Solutions:**
- Token expired: Login again
- `JWT_SECRET` changed: All users logged out (expected)
- Token not in localStorage: Check `prismatech_token` key
- Malformed token: Clear localStorage and login

### 4. File Upload Issues

**Problem**: "Cannot read property 'buffer' of undefined"

**Solution:**
- Ensure multer uses `memoryStorage()`
- Check `enctype="multipart/form-data"` in form
- File field name matches multer config: `upload.single('file')`

**Recent Fix**: Moved from disk storage to memory storage to avoid path issues.

### 5. Migration Doesn't Run

**Problem**: Tables not created on startup

**Solutions:**
- Check server logs for migration errors
- Manually run: `psql -U user -d rapidflow -f backend/migrations/001_schema.sql`
- Verify database exists: `psql -l`
- Check database connection: Look for "Database conectado" in logs

### 6. Rate Limiting Blocks Requests

**Problem**: "Too many requests" (429 status)

**Current Limit**: 200 requests per 15 minutes

**Solutions:**
- For development: Increase limit in `server.js`
- For production: Normal behavior, wait or implement per-user limits
- Testing: Use different IP or reset Docker/server

### 7. Portuguese vs English

**Problem**: Inconsistent language in responses

**Convention**:
- User-facing messages: **Portuguese (PT-BR)**
- Code (variables, functions): **English**
- Comments: **Portuguese**
- Logs: **Portuguese** (user-facing) or **English** (debug)

### 8. SQL Injection Vulnerability

**Problem**: User input directly in SQL string

**Solution**: ALWAYS use parameterized queries
```javascript
// ❌ NEVER DO THIS
await pool.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ ALWAYS DO THIS
await pool.query('SELECT * FROM users WHERE email = $1', [email]);
```

---

## 🔧 TROUBLESHOOTING

### Server Won't Start

**Check:**
1. Port 5000 available: `lsof -i :5000` (kill if occupied)
2. Node version: `node -v` (requires 18+)
3. Dependencies installed: `npm install`
4. `.env` file exists and valid
5. Database is running and accessible

**Logs to check:**
```bash
# Backend logs
cd backend
npm run dev

# Look for:
# ✅ "Servidor rodando na porta 5000"
# ✅ "Database conectado com sucesso"
# ❌ "Error: Missing JWT_SECRET"
# ❌ "ECONNREFUSED" (database down)
```

### Database Issues

**Cannot connect:**
```bash
# Test PostgreSQL connection
psql -U postgres -d rapidflow

# If fails:
sudo service postgresql start  # Linux
brew services start postgresql # macOS

# Check database exists
psql -U postgres -l | grep rapidflow

# Recreate if needed
dropdb rapidflow
createdb rapidflow
```

**Tables missing:**
```bash
# Check tables
psql -U postgres -d rapidflow -c "\dt"

# Run migration manually
psql -U postgres -d rapidflow -f backend/migrations/001_schema.sql

# Or restart server (auto-migration)
npm run dev
```

### Frontend Issues

**API requests fail:**
1. Check `API_URL` in `frontend/js/api.js`
2. Verify backend is running: Visit `http://localhost:5000/health`
3. Check browser console for CORS errors
4. Verify token in localStorage: `localStorage.getItem('prismatech_token')`

**Login redirects to login.html:**
- Token expired or invalid
- Clear localStorage: `localStorage.clear()`
- Login again

**File upload fails:**
1. Check file size < 5MB
2. Verify file type: CSV or Excel (.xlsx, .xls)
3. Check browser console for errors
4. Verify backend multer configuration

### Production Issues (Render)

**502 Bad Gateway:**
- Server crashed on startup (check logs)
- Port mismatch (must use `process.env.PORT`)
- Build failed (check build logs)

**Database connection timeout:**
- Using external URL instead of internal
- Wrong credentials
- Database is spinning down (free tier - first request slow)

**Environment variables not working:**
- Re-deploy after changing variables
- Check variable names match code exactly
- No quotes needed in Render UI

---

## 📚 ADDITIONAL RESOURCES

### Important Links

- **Repository**: https://github.com/MoysesTI/RapidFlow
- **Render Docs**: https://render.com/docs
- **Express.js**: https://expressjs.com/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Evolution API**: https://doc.evolution-api.com/

### Related Documentation

- `README.md`: User-facing documentation (Portuguese)
- `SECURITY.md`: Security guidelines and checklist
- `backend/.env.example`: Environment variable template

### Learning Resources

- **JWT**: https://jwt.io/introduction
- **bcrypt**: https://github.com/kelektiv/node.bcrypt.js
- **CORS**: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- **SQL Injection**: https://owasp.org/www-community/attacks/SQL_Injection

---

## 🤖 AI ASSISTANT WORKFLOW

### When Starting a New Task

1. **Read CLAUDE.md first** (you're reading it!)
2. Review recent commits: `git log --oneline -10`
3. Check current branch: `git status`
4. Understand the context: Read related controllers/routes
5. Plan the change: Consider security, error handling, audit logs

### Making Changes

1. **Read before edit**: Always read files before modifying
2. **Follow conventions**: Match existing code style
3. **Test locally**: Run server and verify changes work
4. **Security check**: Review SECURITY.md requirements
5. **Commit properly**: Use semantic commit messages

### When Stuck

1. Check [Troubleshooting](#troubleshooting) section
2. Review [Common Pitfalls](#common-pitfalls)
3. Check server/browser logs
4. Test with curl or Postman
5. Ask user for clarification

### Before Committing

- [ ] Code follows conventions (Portuguese messages, English code)
- [ ] No hardcoded secrets or credentials
- [ ] Error handling is comprehensive
- [ ] Database queries are parameterized
- [ ] Audit logging added (if needed)
- [ ] Tested locally and works
- [ ] Commit message is semantic (feat:/fix:/etc.)

---

## 📝 CHANGELOG

### Version 2.3.0 (2025-11-14)
- Comprehensive CLAUDE.md created
- Documented all patterns and conventions
- Added troubleshooting guide
- Security checklist updated

### Recent Fixes (Git History)
- `740bdd2`: Robust CORS configuration and error handling
- `ee9ad7f`: Resolve CORS and 502 errors
- `f385c76`: Implement comprehensive security measures
- `7d8f543`: Complete settings implementation + database fix
- `d149a0a`: Switch to memory storage for uploads

---

## 🎯 QUICK REFERENCE

### Most Common Tasks

**Add new API endpoint:**
1. Create function in controller: `backend/src/controllers/`
2. Add route: `backend/src/routes/`
3. Test with curl or Postman
4. Update frontend API client: `frontend/js/api.js`

**Add database column:**
1. Create migration SQL file
2. Update auto-migration.js
3. Test on clean database
4. Update affected controllers

**Fix CORS issue:**
1. Add origin to `CORS_ORIGIN` env variable
2. Restart server
3. Clear browser cache

**Debug authentication:**
1. Check token in localStorage
2. Verify `/api/auth/verify` works
3. Check `JWT_SECRET` hasn't changed
4. Review middleware logs

---

**Last Updated:** 2025-11-14
**Maintainer:** AI Assistants (Claude, etc.)
**For Questions:** Review this guide, check SECURITY.md, or consult repository owner

**End of CLAUDE.md** 🤖
