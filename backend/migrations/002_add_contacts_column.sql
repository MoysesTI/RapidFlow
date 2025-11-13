-- Migration: Add contacts column to campaigns table
-- Date: 2025-11-12

DO $$ 
BEGIN
    -- Verificar se a coluna já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'contacts'
    ) THEN
        -- Adicionar coluna contacts
        ALTER TABLE campaigns ADD COLUMN contacts JSONB NOT NULL DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Column contacts added successfully';
    ELSE
        RAISE NOTICE 'Column contacts already exists';
    END IF;

    -- Verificar se a coluna config existe, se não, criar
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'config'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb;
        RAISE NOTICE 'Column config added successfully';
    ELSE
        RAISE NOTICE 'Column config already exists';
    END IF;

    -- Verificar se a coluna campaign_id existe, se não, criar
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'campaigns' 
        AND column_name = 'campaign_id'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN campaign_id VARCHAR(255) UNIQUE;
        RAISE NOTICE 'Column campaign_id added successfully';
    ELSE
        RAISE NOTICE 'Column campaign_id already exists';
    END IF;

END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);