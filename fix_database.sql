-- =====================================================
-- CORREÇÃO DO BANCO DE DADOS
-- Execute no Shell do PostgreSQL do Render
-- =====================================================

DO $$ 
BEGIN
    -- Adicionar coluna contacts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'contacts'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN contacts JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE '✅ Coluna contacts adicionada';
    ELSE
        RAISE NOTICE '⚠️  Coluna contacts já existe';
    END IF;

    -- Adicionar coluna config
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'config'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE '✅ Coluna config adicionada';
    ELSE
        RAISE NOTICE '⚠️  Coluna config já existe';
    END IF;

    -- Adicionar coluna campaign_id
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN campaign_id VARCHAR(255) UNIQUE;
        RAISE NOTICE '✅ Coluna campaign_id adicionada';
    ELSE
        RAISE NOTICE '⚠️  Coluna campaign_id já existe';
    END IF;
END $$;

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Verificar estrutura final
SELECT 
    column_name, 
    data_type,
    CASE WHEN is_nullable = 'NO' THEN '✅ NOT NULL' ELSE '⚠️  NULL' END as nullable
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;