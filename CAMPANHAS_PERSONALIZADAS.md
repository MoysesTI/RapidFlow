# 📢 Sistema de Campanhas Personalizadas - RapidFlow v3.1

## 🎯 Visão Geral

Este documento descreve as melhorias implementadas no RapidFlow para suportar **campanhas personalizadas** com webhooks individuais e mensagens customizadas por campanha.

### O que mudou?

**Antes (v3.0):**
- Webhooks configurados globalmente por usuário
- Uma única mensagem padrão para todas as campanhas
- Limitações na flexibilidade de gerenciamento

**Agora (v3.1):**
- ✅ Cada campanha possui seus próprios webhooks (A e B)
- ✅ Mensagens personalizadas por campanha
- ✅ Interface completa para gerenciar campanhas (criar, editar, deletar)
- ✅ Sistema de fallback automático (se Webhook A falhar, tenta Webhook B)
- ✅ Descrições e metadados para cada campanha

---

## 🚀 Funcionalidades Novas

### 1. Webhooks Individuais por Campanha

Cada campanha agora pode ter:
- **Webhook A** (principal): URL do n8n ou outro sistema de automação
- **Webhook B** (backup): URL alternativa caso o Webhook A falhe

**Vantagens:**
- Diferentes campanhas podem usar diferentes fluxos de automação
- Redundância automática com fallback
- Maior flexibilidade para testes A/B

### 2. Mensagens Personalizadas

Defina mensagens únicas para cada campanha ao invés de usar uma mensagem global.

**Exemplo:**
```
Campanha "Black Friday 2025"
Mensagem: "🔥 Olá! Temos uma SUPER promoção de Black Friday..."

Campanha "Lançamento de Produto"
Mensagem: "✨ Olá! Acabamos de lançar nosso novo produto..."
```

### 3. Interface de Gerenciamento

Nova página dedicada: **campaigns.html**

**Recursos:**
- 📋 Listar todas as campanhas com filtros
- ➕ Criar novas campanhas com wizard intuitivo
- ✏️ Editar campanhas pendentes
- 🗑️ Deletar campanhas não executadas
- ▶️ Executar campanhas diretamente
- 👁️ Visualizar detalhes e estatísticas

### 4. Sistema de Fallback

Quando uma campanha é executada:
1. Sistema tenta enviar para **Webhook A**
2. Se falhar, automaticamente tenta **Webhook B**
3. Registra qual webhook foi usado com sucesso
4. Notifica o usuário via WebSocket

---

## 💾 Instalação e Migração

### Passo 1: Atualizar o Banco de Dados

#### Opção A: Usando pgAdmin (Recomendado)

1. Abra o **pgAdmin**
2. Conecte no seu servidor PostgreSQL 17
3. Selecione o banco de dados **RapidFlow**
4. Abra o **Query Tool**
5. Copie e execute o conteúdo do arquivo: `EXECUTAR_NO_PGADMIN.sql`

```sql
-- Exemplo de execução:
-- 1. Abrir pgAdmin
-- 2. RapidFlow > Databases > RapidFlow > Query Tool
-- 3. Colar o conteúdo do arquivo EXECUTAR_NO_PGADMIN.sql
-- 4. Executar (F5 ou botão ▶️)
```

#### Opção B: Usando PowerShell (Windows)

```powershell
# Definir variáveis de ambiente
$env:PGPASSWORD = "SUA_SENHA_POSTGRES"

# Executar migration
psql -U postgres -d RapidFlow -f "C:\caminho\para\EXECUTAR_NO_PGADMIN.sql"
```

#### Opção C: Usando Bash/Terminal (Linux/Mac)

```bash
export PGPASSWORD='SUA_SENHA_POSTGRES'
psql -U postgres -d RapidFlow -f ./EXECUTAR_NO_PGADMIN.sql
```

### Passo 2: Verificar a Migration

Após executar o script, você deve ver:

```
✅ Migration executada com sucesso!
📢 Sistema de Campanhas Personalizadas ativado
🔗 Cada campanha agora pode ter seus próprios webhooks A e B
💬 Mensagens personalizadas por campanha disponíveis
```

Execute esta query para confirmar:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'campaigns'
  AND column_name IN ('webhook_url_a', 'webhook_url_b', 'custom_message', 'description')
ORDER BY column_name;
```

Você deve ver as 4 novas colunas.

---

## 📖 Como Usar

### Criar uma Nova Campanha

1. **Acesse a interface:**
   - Abra o navegador: `http://localhost:3000`
   - Clique em **"📢 Minhas Campanhas"** no menu superior
   - Ou acesse diretamente: `http://localhost:3000/campaigns.html`

2. **Clique em "Nova Campanha"**

3. **Preencha o formulário:**
   ```
   Nome: Black Friday 2025
   Descrição: Campanha promocional de Black Friday

   Webhook A: https://n8n.example.com/webhook/blackfriday
   Webhook B: https://n8n-backup.example.com/webhook/blackfriday

   Mensagem Personalizada:
   🔥 Olá {nome}!

   Temos uma SUPER promoção de Black Friday!
   Aproveite 50% de desconto em todos os produtos.

   Arquivo de Contatos: [selecionar arquivo CSV/XLSX]
   ```

4. **Clique em "Criar Campanha"**

5. **Execute a campanha:**
   - Na lista, clique em "▶ Executar"
   - Confirme a ação
   - Acompanhe o progresso em tempo real

### Editar uma Campanha

1. Na lista de campanhas, clique em **"✏ Editar"**
2. Modifique os campos desejados
3. Clique em **"Salvar Alterações"**

**Nota:** Apenas campanhas com status "Aguardando" podem ser editadas.

### Deletar uma Campanha

1. Na lista de campanhas, clique em **"🗑 Deletar"**
2. Confirme a ação

**Nota:** Campanhas em execução não podem ser deletadas.

---

## 🔧 API Endpoints

### Novos Endpoints Adicionados

#### 1. Criar Campanha (atualizado)
```http
POST /api/campaigns
Authorization: Bearer {token}

{
  "name": "Nome da Campanha",
  "description": "Descrição opcional",
  "webhook_url_a": "https://n8n.example.com/webhook/1",
  "webhook_url_b": "https://n8n.example.com/webhook/2",
  "custom_message": "Olá! Mensagem personalizada...",
  "contacts": [...],
  "config": {
    "delayMin": 140,
    "delayMax": 380
  }
}
```

#### 2. Atualizar Campanha
```http
PUT /api/campaigns/:id
Authorization: Bearer {token}

{
  "name": "Novo Nome",
  "description": "Nova descrição",
  "webhook_url_a": "https://...",
  "webhook_url_b": "https://...",
  "custom_message": "Nova mensagem..."
}
```

#### 3. Deletar Campanha
```http
DELETE /api/campaigns/:id
Authorization: Bearer {token}
```

#### 4. Listar Campanhas (atualizado)
```http
GET /api/campaigns
Authorization: Bearer {token}

Response:
{
  "success": true,
  "campaigns": [
    {
      "id": 1,
      "campaign_id": "CAMP-1234567890",
      "name": "Black Friday 2025",
      "description": "Campanha promocional",
      "status": "pending",
      "total_contacts": 1000,
      "sent_count": 0,
      "error_count": 0,
      "webhook_url_a": "https://...",
      "webhook_url_b": "https://...",
      "custom_message": "Olá...",
      "created_at": "2025-01-14T10:00:00Z",
      "updated_at": "2025-01-14T10:00:00Z"
    }
  ]
}
```

---

## 🗃️ Estrutura do Banco de Dados

### Novas Colunas na Tabela `campaigns`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `webhook_url_a` | TEXT | Webhook principal (n8n ou outro) |
| `webhook_url_b` | TEXT | Webhook backup/secundário |
| `custom_message` | TEXT | Mensagem personalizada da campanha |
| `description` | TEXT | Descrição da campanha |

### Índices Adicionados

```sql
CREATE INDEX idx_campaigns_user_created
ON campaigns(user_id, created_at DESC);
```

**Benefício:** Melhora significativa na performance ao listar campanhas por usuário.

---

## 🎨 Frontend

### Arquivos Modificados

1. **`frontend/js/api.js`**
   - Adicionados métodos: `updateCampaign()`, `deleteCampaign()`

2. **`frontend/index.html`**
   - Adicionado link para página de campanhas no header

3. **`frontend/campaigns.html`** (NOVO)
   - Interface completa de gerenciamento de campanhas
   - Grid responsivo com cards
   - Modal para criar/editar campanhas
   - Filtros e ações em tempo real

### Navegação

```
index.html (Dashboard)
    ├─ [📢 Minhas Campanhas] → campaigns.html
    └─ [👁 Detalhes] → volta para index.html com filtro
```

---

## ⚙️ Backend

### Arquivos Modificados

1. **`backend/src/controllers/campaignController.js`**
   - `createCampaign()`: Aceita webhooks individuais e mensagem personalizada
   - `executeCampaign()`: Implementa fallback automático entre webhooks
   - `listCampaigns()`: Retorna novos campos
   - `updateCampaign()`: NOVO - Atualiza campanha existente
   - `deleteCampaign()`: NOVO - Deleta campanha e dados relacionados

2. **`backend/src/routes/campaigns.js`**
   - Adicionadas rotas: `PUT /:id`, `DELETE /:id`

3. **`backend/migrations/005_custom_campaigns.sql`** (NOVO)
   - Migration para adicionar novas colunas

---

## 🔒 Segurança e Validações

### Validações Implementadas

1. **Criação de Campanha:**
   - Ao menos 1 webhook (A ou B) é obrigatório
   - Nome da campanha obrigatório
   - Mensagem personalizada obrigatória
   - Arquivo de contatos obrigatório

2. **Atualização de Campanha:**
   - Apenas campanhas "pending" podem ser editadas
   - Verifica ownership (usuário dono da campanha)
   - Não permite remover ambos os webhooks

3. **Deleção de Campanha:**
   - Apenas campanhas "pending" ou "completed" podem ser deletadas
   - Campanhas "running" são bloqueadas
   - Deleção em cascata (eventos, logs, contatos)

### Permissões

- Todas as operações requerem autenticação JWT
- Usuários só podem gerenciar suas próprias campanhas
- Rate limiting aplicado (60 req/min)

---

## 📊 Fluxo de Execução

### Quando uma campanha é executada:

```
1. Usuário clica em "▶ Executar"
   ↓
2. Frontend chama POST /api/campaigns/:id/execute
   ↓
3. Backend busca dados da campanha
   ↓
4. Backend prepara payload com:
   - Contatos
   - Configurações
   - Mensagem personalizada (custom_message)
   ↓
5. Backend tenta enviar para webhook_url_a
   ↓
6. Se webhook_url_a falhar e webhook_url_b existir:
   - Tenta webhook_url_b
   ↓
7. Registra evento com qual webhook foi usado
   ↓
8. Notifica usuário via WebSocket
   ↓
9. n8n/workflow processa contatos
   ↓
10. n8n faz callbacks para:
    - POST /api/campaigns/:id/update-status
    - POST /api/campaigns/:id/progress
    - POST /api/campaigns/:id/complete
```

---

## 🧪 Como Testar

### Teste 1: Criar Campanha

```bash
# 1. Preparar arquivo de contatos (CSV)
nome,telefone
João Silva,11999999999
Maria Santos,11988888888

# 2. Acessar http://localhost:3000/campaigns.html
# 3. Clicar em "Nova Campanha"
# 4. Preencher todos os campos
# 5. Fazer upload do CSV
# 6. Clicar em "Criar Campanha"
# 7. Verificar se aparece na lista
```

### Teste 2: Fallback de Webhooks

```bash
# 1. Criar campanha com:
#    - Webhook A: URL inválida (ex: https://teste-invalido.com)
#    - Webhook B: URL válida do n8n
# 2. Executar campanha
# 3. Verificar nos logs que:
#    - Tentou Webhook A (falhou)
#    - Tentou Webhook B (sucesso)
#    - Mensagem: "usando webhook B"
```

### Teste 3: Editar Campanha

```bash
# 1. Criar campanha (não executar)
# 2. Clicar em "✏ Editar"
# 3. Modificar nome e mensagem
# 4. Salvar
# 5. Verificar alterações na lista
```

### Teste 4: Deletar Campanha

```bash
# 1. Criar campanha
# 2. Clicar em "🗑 Deletar"
# 3. Confirmar
# 4. Verificar remoção da lista
# 5. Verificar no banco que dados foram removidos
```

---

## 🐛 Solução de Problemas

### Erro: "Migration já executada"

Se você receber este erro, a migration já foi aplicada anteriormente.

**Verificar:**
```sql
SELECT * FROM schema_migrations WHERE version = 5;
```

Se retornar uma linha, a migration já está aplicada.

### Erro: "Nenhum webhook configurado"

Ao executar campanha, certifique-se de que:
- Webhook A OU Webhook B está preenchido
- URLs são válidas (começam com http:// ou https://)

### Erro: "Não é possível atualizar campanha em execução"

Campanhas com status "running" não podem ser editadas.

**Solução:** Aguarde a conclusão ou pare a campanha primeiro.

### Erro: "Campanha não encontrada"

Certifique-se de que:
- Você está autenticado
- A campanha pertence ao seu usuário
- O ID da campanha está correto

---

## 📈 Melhorias de Performance

### Antes
```sql
SELECT * FROM campaigns WHERE user_id = 123;
-- Seq Scan em campaigns (slow)
```

### Depois
```sql
SELECT * FROM campaigns WHERE user_id = 123 ORDER BY created_at DESC;
-- Index Scan usando idx_campaigns_user_created (fast)
```

**Resultado:** Queries até 10x mais rápidas em bases com muitas campanhas.

---

## 🔄 Compatibilidade

### Retrocompatibilidade

✅ **Campanhas antigas continuam funcionando:**
- Migration preenche `webhook_url_a` com valor de `user_configs.webhook_url`
- Se `custom_message` for NULL, usa `config.systemPrompt`
- Sem breaking changes na API

### Requisitos

- PostgreSQL 13+
- Node.js 18+
- Frontend moderno (suporta ES6+)

---

## 📝 Notas Importantes

1. **Webhooks duplicados:** Você pode usar a mesma URL em webhook A e B se quiser apenas redundância de rede.

2. **Mensagens dinâmicas:** Use variáveis como `{nome}` na mensagem personalizada se seu n8n suportar.

3. **Limite de contatos:** Máximo de 10.000 contatos por campanha (configurável em `middleware/validation.js`).

4. **Rate limiting:** Máximo de 5 campanhas simultâneas por usuário.

---

## 🎯 Próximos Passos

Após implementar este sistema, você pode:

1. ✅ Criar múltiplas campanhas com diferentes propósitos
2. ✅ Testar diferentes fluxos de n8n para cada campanha
3. ✅ Personalizar mensagens por público-alvo
4. ✅ Monitorar performance individual de cada campanha
5. ✅ Escalar operações com webhooks dedicados

---

## 🆘 Suporte

### Logs

Verifique os logs do backend:
```bash
# Linux/Mac
tail -f backend/logs/$(date +%Y-%m-%d)-info.log

# Windows PowerShell
Get-Content backend/logs/$(Get-Date -Format "yyyy-MM-dd")-info.log -Wait -Tail 50
```

### Contato

- Issues: [GitHub Issues](https://github.com/MoysesTI/RapidFlow/issues)
- Documentação: Este arquivo

---

## ✨ Créditos

**RapidFlow v3.1 - Sistema de Campanhas Personalizadas**

Desenvolvido com ❤️ para facilitar o gerenciamento de campanhas de WhatsApp em larga escala.

---

**Última atualização:** Janeiro 2025
**Versão:** 3.1.0
