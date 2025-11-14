-- =====================================================
-- MIGRATION 002 - SISTEMA DE LOGS DE MENSAGENS
-- =====================================================

-- Tabela para logs detalhados de cada mensagem enviada
CREATE TABLE IF NOT EXISTS campaign_message_logs (
    id SERIAL PRIMARY KEY,
    campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'sent', 'error', 'pending'
    message_text TEXT,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaign_message_logs_campaign_id ON campaign_message_logs(campaign_id);
CREATE INDEX idx_campaign_message_logs_status ON campaign_message_logs(status);

-- Adicionar colunas de controle de IA na tabela user_configs (se não existirem)
ALTER TABLE user_configs
ADD COLUMN IF NOT EXISTS use_ai BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3;

-- Adicionar coluna de progresso em tempo real
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS current_position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

SELECT 'Migration 002 completed!' as message;
