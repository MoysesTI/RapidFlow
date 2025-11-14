-- =====================================================
-- RAPIDFLOW v3.0 - SISTEMA DE LOGS E MONITORAMENTO AVANÇADO
-- =====================================================
-- Migration: 002 - Enhanced Logging System
-- Date: 2025-11-14
-- Description: Sistema completo de logs, webhooks, mensagens e analytics
-- =====================================================

-- ────────────────────────────────────────────────────
-- 1. TABELA DE WEBHOOKS N8N
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS n8n_webhooks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    webhook_name VARCHAR(255) NOT NULL,
    webhook_url TEXT NOT NULL,
    webhook_path VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT true,
    auth_type VARCHAR(50) DEFAULT 'none', -- 'none', 'basic', 'bearer', 'apikey'
    auth_credentials JSONB, -- Encrypted credentials
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP
);

CREATE INDEX idx_n8n_webhooks_user_id ON n8n_webhooks(user_id);
CREATE INDEX idx_n8n_webhooks_active ON n8n_webhooks(is_active);

-- ────────────────────────────────────────────────────
-- 2. TABELA DE MENSAGENS ENVIADAS (Histórico Completo)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_messages (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_id INTEGER REFERENCES campaign_contacts(id) ON DELETE SET NULL,

    -- Dados do contato
    contact_name VARCHAR(255),
    phone VARCHAR(50) NOT NULL,
    phone_normalized VARCHAR(20),

    -- Conteúdo da mensagem
    message_text TEXT,
    message_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'video', 'document', 'audio'
    media_url TEXT,
    ai_generated BOOLEAN DEFAULT false,
    ai_model VARCHAR(100),

    -- Status e timing
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'read', 'failed', 'blocked'
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Evolution API Response
    evolution_message_id VARCHAR(255),
    evolution_response JSONB,

    -- Error tracking
    error_message TEXT,
    error_code VARCHAR(50),
    error_details JSONB,

    -- Timestamps
    queued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_messages_campaign_id ON campaign_messages(campaign_id);
CREATE INDEX idx_campaign_messages_status ON campaign_messages(status);
CREATE INDEX idx_campaign_messages_phone ON campaign_messages(phone_normalized);
CREATE INDEX idx_campaign_messages_sent_at ON campaign_messages(sent_at);

-- ────────────────────────────────────────────────────
-- 3. TABELA DE LOGS DO SISTEMA (Detalhado)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system_logs (
    id SERIAL PRIMARY KEY,

    -- Contexto
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,

    -- Tipo e severidade
    log_level VARCHAR(20) NOT NULL, -- 'debug', 'info', 'warn', 'error', 'critical'
    log_type VARCHAR(50) NOT NULL, -- 'api', 'webhook', 'n8n', 'auth', 'campaign', 'system'

    -- Conteúdo
    message TEXT NOT NULL,
    details JSONB,

    -- Stack trace para erros
    stack_trace TEXT,

    -- Contexto HTTP
    http_method VARCHAR(10),
    http_path TEXT,
    http_status INTEGER,
    http_ip INET,
    http_user_agent TEXT,

    -- Timing
    duration_ms INTEGER,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_logs_level ON system_logs(log_level);
CREATE INDEX idx_system_logs_type ON system_logs(log_type);
CREATE INDEX idx_system_logs_user_id ON system_logs(user_id);
CREATE INDEX idx_system_logs_campaign_id ON system_logs(campaign_id);
CREATE INDEX idx_system_logs_created_at ON system_logs(created_at DESC);

-- ────────────────────────────────────────────────────
-- 4. TABELA DE EVENTOS N8N (Webhook Callbacks)
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS n8n_events (
    id SERIAL PRIMARY KEY,
    webhook_id INTEGER REFERENCES n8n_webhooks(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL,

    -- Dados do evento
    event_type VARCHAR(100) NOT NULL, -- 'campaign_start', 'message_sent', 'message_failed', 'progress_update', 'campaign_complete'
    event_data JSONB NOT NULL,

    -- Request info
    request_method VARCHAR(10),
    request_headers JSONB,
    request_body JSONB,
    request_ip INET,

    -- Response info
    response_status INTEGER,
    response_body JSONB,
    response_time_ms INTEGER,

    -- Status
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP,

    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_n8n_events_webhook_id ON n8n_events(webhook_id);
CREATE INDEX idx_n8n_events_campaign_id ON n8n_events(campaign_id);
CREATE INDEX idx_n8n_events_type ON n8n_events(event_type);
CREATE INDEX idx_n8n_events_processed ON n8n_events(processed);

-- ────────────────────────────────────────────────────
-- 5. TABELA DE ANALYTICS E MÉTRICAS
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS campaign_analytics (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER UNIQUE NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Contadores
    total_contacts INTEGER DEFAULT 0,
    total_queued INTEGER DEFAULT 0,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_read INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_blocked INTEGER DEFAULT 0,

    -- Taxas (%)
    delivery_rate DECIMAL(5,2),
    read_rate DECIMAL(5,2),
    failure_rate DECIMAL(5,2),

    -- Timing
    avg_send_time_ms INTEGER,
    min_send_time_ms INTEGER,
    max_send_time_ms INTEGER,
    total_duration_ms BIGINT,

    -- AI Usage
    ai_messages_count INTEGER DEFAULT 0,
    ai_tokens_used INTEGER DEFAULT 0,
    ai_cost_usd DECIMAL(10,4),

    -- Progress tracking
    current_position INTEGER DEFAULT 0,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    estimated_completion TIMESTAMP,

    -- Errors
    error_breakdown JSONB, -- {"network": 5, "invalid_number": 2, "blocked": 1}

    -- Timestamps
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_analytics_campaign_id ON campaign_analytics(campaign_id);

-- ────────────────────────────────────────────────────
-- 6. TABELA DE RATE LIMITING E CIRCUIT BREAKER
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,

    -- Rate limiting
    endpoint VARCHAR(255),
    requests_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    window_end TIMESTAMP,

    -- Circuit breaker
    consecutive_failures INTEGER DEFAULT 0,
    circuit_state VARCHAR(20) DEFAULT 'closed', -- 'closed', 'open', 'half_open'
    last_failure_at TIMESTAMP,
    circuit_opened_at TIMESTAMP,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rate_limit_user_id ON rate_limit_tracking(user_id);
CREATE INDEX idx_rate_limit_campaign_id ON rate_limit_tracking(campaign_id);
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start, window_end);

-- ────────────────────────────────────────────────────
-- 7. TABELA DE CONFIGURAÇÕES N8N
-- ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS n8n_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Configurações de webhook
    webhook_url TEXT,
    webhook_secret VARCHAR(255),
    webhook_retry_attempts INTEGER DEFAULT 3,
    webhook_timeout_ms INTEGER DEFAULT 30000,

    -- Configurações de processamento
    batch_size INTEGER DEFAULT 1,
    delay_between_batches_ms INTEGER DEFAULT 1000,
    max_concurrent_requests INTEGER DEFAULT 5,

    -- Circuit breaker settings
    circuit_breaker_enabled BOOLEAN DEFAULT true,
    circuit_breaker_threshold INTEGER DEFAULT 5,
    circuit_breaker_timeout_ms INTEGER DEFAULT 60000,

    -- Retry settings
    retry_enabled BOOLEAN DEFAULT true,
    retry_max_attempts INTEGER DEFAULT 3,
    retry_backoff_multiplier DECIMAL(3,2) DEFAULT 2.0,
    retry_initial_delay_ms INTEGER DEFAULT 2000,

    -- Features
    enable_ai BOOLEAN DEFAULT true,
    enable_analytics BOOLEAN DEFAULT true,
    enable_detailed_logging BOOLEAN DEFAULT true,

    -- Metadata
    metadata JSONB,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_n8n_configs_user_id ON n8n_configs(user_id);

-- ────────────────────────────────────────────────────
-- 8. FUNÇÕES AUXILIARES
-- ────────────────────────────────────────────────────

-- Função para calcular taxa de sucesso
CREATE OR REPLACE FUNCTION calculate_success_rate(sent INTEGER, total INTEGER)
RETURNS DECIMAL(5,2) AS $$
BEGIN
    IF total = 0 THEN RETURN 0;
    END IF;
    RETURN ROUND((sent::DECIMAL / total::DECIMAL) * 100, 2);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para atualizar analytics automaticamente
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO campaign_analytics (
        campaign_id,
        total_contacts,
        total_queued,
        total_sent,
        total_delivered,
        total_read,
        total_failed,
        current_position,
        last_updated_at
    )
    SELECT
        c.id,
        c.total_contacts,
        COUNT(*) FILTER (WHERE cm.status = 'pending'),
        COUNT(*) FILTER (WHERE cm.status = 'sent'),
        COUNT(*) FILTER (WHERE cm.status = 'delivered'),
        COUNT(*) FILTER (WHERE cm.status = 'read'),
        COUNT(*) FILTER (WHERE cm.status = 'failed'),
        COALESCE(MAX(cm.id), 0),
        NOW()
    FROM campaigns c
    LEFT JOIN campaign_messages cm ON c.id = cm.campaign_id
    WHERE c.id = NEW.campaign_id
    GROUP BY c.id
    ON CONFLICT (campaign_id) DO UPDATE SET
        total_queued = EXCLUDED.total_queued,
        total_sent = EXCLUDED.total_sent,
        total_delivered = EXCLUDED.total_delivered,
        total_read = EXCLUDED.total_read,
        total_failed = EXCLUDED.total_failed,
        current_position = EXCLUDED.current_position,
        delivery_rate = calculate_success_rate(EXCLUDED.total_delivered, EXCLUDED.total_contacts),
        read_rate = calculate_success_rate(EXCLUDED.total_read, EXCLUDED.total_sent),
        failure_rate = calculate_success_rate(EXCLUDED.total_failed, EXCLUDED.total_contacts),
        last_updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar analytics ao inserir/atualizar mensagens
DROP TRIGGER IF EXISTS trigger_update_analytics ON campaign_messages;
CREATE TRIGGER trigger_update_analytics
AFTER INSERT OR UPDATE ON campaign_messages
FOR EACH ROW
EXECUTE FUNCTION update_campaign_analytics();

-- Função para limpar logs antigos (manter últimos 90 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL '90 days';
    DELETE FROM n8n_events WHERE created_at < NOW() - INTERVAL '90 days' AND processed = true;
    RAISE NOTICE 'Logs antigos removidos com sucesso';
END;
$$ LANGUAGE plpgsql;

-- ────────────────────────────────────────────────────
-- 9. TRIGGER PARA AUTO-UPDATE DE updated_at
-- ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_n8n_webhooks_updated_at BEFORE UPDATE ON n8n_webhooks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_messages_updated_at BEFORE UPDATE ON campaign_messages
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_n8n_configs_updated_at BEFORE UPDATE ON n8n_configs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────
-- 10. VIEWS PARA RELATÓRIOS
-- ────────────────────────────────────────────────────

-- View: Resumo de campanhas com analytics
CREATE OR REPLACE VIEW v_campaigns_summary AS
SELECT
    c.id,
    c.campaign_id,
    c.name,
    c.status,
    c.user_id,
    u.username,
    ca.total_contacts,
    ca.total_sent,
    ca.total_delivered,
    ca.total_read,
    ca.total_failed,
    ca.delivery_rate,
    ca.read_rate,
    ca.failure_rate,
    ca.progress_percentage,
    ca.started_at,
    ca.completed_at,
    c.created_at
FROM campaigns c
LEFT JOIN campaign_analytics ca ON c.id = ca.campaign_id
LEFT JOIN users u ON c.user_id = u.id
ORDER BY c.created_at DESC;

-- View: Logs de erros recentes
CREATE OR REPLACE VIEW v_recent_errors AS
SELECT
    id,
    log_level,
    log_type,
    message,
    user_id,
    campaign_id,
    http_path,
    http_status,
    created_at
FROM system_logs
WHERE log_level IN ('error', 'critical')
ORDER BY created_at DESC
LIMIT 100;

-- View: Performance de webhooks
CREATE OR REPLACE VIEW v_webhook_performance AS
SELECT
    w.id,
    w.webhook_name,
    w.webhook_url,
    w.is_active,
    COUNT(e.id) as total_events,
    COUNT(e.id) FILTER (WHERE e.processed = true) as processed_events,
    AVG(e.response_time_ms) as avg_response_time,
    MAX(e.created_at) as last_event_at
FROM n8n_webhooks w
LEFT JOIN n8n_events e ON w.id = e.webhook_id
GROUP BY w.id, w.webhook_name, w.webhook_url, w.is_active
ORDER BY total_events DESC;

-- ────────────────────────────────────────────────────
-- ✅ MIGRATION COMPLETA
-- ────────────────────────────────────────────────────
SELECT 'Enhanced Logging System v3.0 instalado com sucesso!' as message;
