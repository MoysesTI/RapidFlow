-- Migration 005: Custom Campaigns with Individual Webhooks
-- Adiciona suporte para webhooks individuais e mensagens personalizadas por campanha

-- Adicionar colunas na tabela campaigns
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS webhook_url_a TEXT,
ADD COLUMN IF NOT EXISTS webhook_url_b TEXT,
ADD COLUMN IF NOT EXISTS custom_message TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Criar índice para melhorar performance de queries por usuário
CREATE INDEX IF NOT EXISTS idx_campaigns_user_created
ON campaigns(user_id, created_at DESC);

-- Adicionar comentários para documentação
COMMENT ON COLUMN campaigns.webhook_url_a IS 'Webhook A para integração com n8n ou outros sistemas';
COMMENT ON COLUMN campaigns.webhook_url_b IS 'Webhook B para integração secundária ou backup';
COMMENT ON COLUMN campaigns.custom_message IS 'Mensagem personalizada para esta campanha (substitui system_prompt global)';
COMMENT ON COLUMN campaigns.description IS 'Descrição da campanha para referência do usuário';

-- Atualizar campaigns existentes com valores padrão dos user_configs
UPDATE campaigns c
SET webhook_url_a = (
    SELECT webhook_url
    FROM user_configs
    WHERE user_id = c.user_id
    LIMIT 1
)
WHERE webhook_url_a IS NULL;

-- Registrar migration
INSERT INTO schema_migrations (version, name, executed_at)
VALUES (5, '005_custom_campaigns', NOW())
ON CONFLICT (version) DO NOTHING;
