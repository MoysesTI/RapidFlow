import psycopg2

print("🔧 Conectando ao banco...")

conn = psycopg2.connect(
    host="dpg-d4a8k82dbo4c73c78j9g-a.oregon-postgres.render.com",
    port=5432,
    database="rapidflow",
    user="rapidflow",
    password="i1j69aEOKBjP7J1GmlVj6TdN1psBO6oA"
)

cur = conn.cursor()

print("✅ Conectado!")
print("📝 Executando SQL...")

# Executar SQL
cur.execute("""
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS contacts JSONB NOT NULL DEFAULT '[]'::jsonb;
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;
    ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(255) UNIQUE;
    CREATE INDEX IF NOT EXISTS idx_campaigns_campaign_id ON campaigns(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
""")

conn.commit()

print("✅ SQL executado com sucesso!")
print("📊 Verificando colunas...")

cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'campaigns' ORDER BY ordinal_position")
columns = cur.fetchall()

print("\n📋 Colunas na tabela campaigns:")
for col in columns:
    print(f"  ✅ {col[0]}")

cur.close()
conn.close()

print("\n🎉 PRONTO! Agora teste criar uma campanha!")