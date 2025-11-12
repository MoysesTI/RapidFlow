-- =====================================================
-- PRISMATECH CAMPAIGN MANAGER - DATABASE SCHEMA
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS user_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    webhook_url TEXT,
    evolution_endpoint TEXT,
    evolution_api_key TEXT,
    openai_api_key TEXT,
    image_url TEXT,
    delay_min INTEGER DEFAULT 140,
    delay_max INTEGER DEFAULT 380,
    openai_model VARCHAR(50) DEFAULT 'gpt-4',
    system_prompt TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Tabela de campanhas
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_contacts INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

-- Tabela de contatos
CREATE TABLE IF NOT EXISTS campaign_contacts (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    phone_normalized VARCHAR(20),
    custom_message TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    sent_at TIMESTAMP,
    error_message TEXT,
    position INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_contacts_campaign_id ON campaign_contacts(campaign_id);

-- Função para normalizar telefone
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN regexp_replace(phone, '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    details JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT 'Database schema ready!' as message;
