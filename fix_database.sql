-- =====================================================
-- CORREÇÃO MANUAL DO BANCO DE DADOS
-- Execute este SQL no Shell do Render
-- =====================================================

-- 1. Adicionar coluna contacts se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'contacts'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN contacts JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Coluna contacts adicionada';
    END IF;
END $$;

-- 2. Adicionar coluna config se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'config'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Coluna config adicionada';
    END IF;
END $$;

-- 3. Adicionar coluna campaign_id se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'campaigns' AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN campaign_id VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Coluna campaign_id adicionada';
    END IF;
END $$;

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- 5. Verificar resultado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;