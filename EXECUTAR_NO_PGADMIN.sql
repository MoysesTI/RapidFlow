-- =====================================================
-- SCRIPT DE MIGRATION: CAMPANHAS PERSONALIZADAS
-- RapidFlow v3.1 - Sistema de Webhooks Individuais
-- =====================================================
-- Execute este script no pgAdmin selecionando o banco de dados RapidFlow
-- Database: RapidFlow (postgres/postgres@PostgreSQL 17)
-- =====================================================

-- Verificar se a tabela schema_migrations existe, senão criar
CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    executed_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- MIGRATION 005: Custom Campaigns with Individual Webhooks
-- =====================================================

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

-- Atualizar campanhas existentes com valores padrão dos user_configs
-- (Isso é seguro, só atualiza se webhook_url_a for NULL)
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

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Mostrar estrutura atualizada da tabela campaigns
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
ORDER BY ordinal_position;

-- Mostrar todas as migrations executadas
SELECT * FROM schema_migrations ORDER BY version;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Migration executada com sucesso!';
    RAISE NOTICE '📢 Sistema de Campanhas Personalizadas ativado';
    RAISE NOTICE '🔗 Cada campanha agora pode ter seus próprios webhooks A e B';
    RAISE NOTICE '💬 Mensagens personalizadas por campanha disponíveis';
END $$;
