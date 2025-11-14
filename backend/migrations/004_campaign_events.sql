-- =====================================================
-- MIGRATION 004 - EVENTOS E ANALYTICS
-- =====================================================

-- Tabela para eventos de campanha (analytics)
CREATE TABLE IF NOT EXISTS campaign_events (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- 'started', 'paused', 'resumed', 'completed', 'error', etc
    event_data JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_events_campaign_id ON campaign_events(campaign_id);
CREATE INDEX idx_campaign_events_type ON campaign_events(event_type);
CREATE INDEX idx_campaign_events_created_at ON campaign_events(created_at);

-- Adicionar colunas de webhooks na tabela user_configs
ALTER TABLE user_configs
ADD COLUMN IF NOT EXISTS webhook_events TEXT[], -- Array de eventos para notificar
ADD COLUMN IF NOT EXISTS enable_analytics BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_real_time_updates BOOLEAN DEFAULT true;

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_completed_at ON campaigns(completed_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_started_at ON campaigns(started_at);

-- View para dashboard rápido
CREATE OR REPLACE VIEW campaign_dashboard AS
SELECT
    c.id,
    c.campaign_id,
    c.user_id,
    c.name,
    c.status,
    c.total_contacts,
    c.sent_count,
    c.error_count,
    c.success_rate,
    c.current_position,
    c.created_at,
    c.started_at,
    c.completed_at,
    c.last_update,
    -- Métricas calculadas
    CASE
        WHEN c.total_contacts > 0
        THEN ROUND((c.sent_count::DECIMAL / c.total_contacts) * 100, 2)
        ELSE 0
    END as progress_percentage,
    CASE
        WHEN c.started_at IS NOT NULL AND c.completed_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (c.completed_at - c.started_at))
        ELSE NULL
    END as duration_seconds,
    -- Contagem de logs
    (SELECT COUNT(*) FROM campaign_message_logs WHERE campaign_id = c.id AND status = 'sent') as messages_sent,
    (SELECT COUNT(*) FROM campaign_message_logs WHERE campaign_id = c.id AND status = 'error') as messages_failed,
    (SELECT COUNT(*) FROM campaign_events WHERE campaign_id = c.id) as total_events
FROM campaigns c;

SELECT 'Migration 004 completed!' as message;
