# 🚀 Guia de Upgrade para RapidFlow v3.0

## 📋 Pré-requisitos

- Node.js >= 18.0.0
- PostgreSQL >= 12
- n8n instalado e configurado
- Git

---

## 🔧 Passo a Passo

### 1. **Backup do Banco de Dados**

```bash
# Fazer backup antes de qualquer alteração
pg_dump -U postgres -d prismatech_campaign > backup_$(date +%Y%m%d).sql
```

### 2. **Atualizar Código do Backend**

```bash
cd backend

# Instalar nova dependência (WebSocket)
npm install ws@^8.16.0

# Verificar se todas as dependências estão instaladas
npm install
```

### 3. **Executar Migrations**

As migrations são executadas automaticamente ao iniciar o servidor, mas você pode verificá-las:

```bash
# Verificar migrations disponíveis
ls backend/migrations/

# Você deve ver:
# 001_schema.sql
# 002_add_contacts_column.sql
# 003_campaign_logs.sql
# 004_campaign_events.sql (NOVA)
```

### 4. **Testar o Servidor**

```bash
cd backend
npm start

# Você deve ver:
# ✅ PostgreSQL conectado
# ✅ Migration 004 executed
# ✅ WebSocket Service inicializado
# ✅ Logger configurado
# 🌐 HTTP: http://0.0.0.0:5000
# 🔌 WebSocket: ws://0.0.0.0:5000/ws
```

### 5. **Verificar Health Check**

```bash
curl http://localhost:5000/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2025-01-14T...",
  "version": "3.0.0",
  "websocket": {
    "totalConnections": 0,
    "subscribedUsers": 0,
    "subscribedCampaigns": 0
  }
}
```

### 6. **Atualizar Workflow n8n**

#### Opção A: Criar Novo Workflow (Recomendado)

1. Abrir n8n
2. Criar novo workflow
3. Importar `workflows/enhanced-campaign-workflow.json`
4. Configurar credenciais OpenAI
5. Atualizar URL do webhook
6. Ativar workflow

#### Opção B: Atualizar Workflow Existente

Se preferir manter o workflow existente:

1. Adicionar node "Circuit Breaker Check"
2. Adicionar node "Calcular Progresso"
3. Adicionar node "Notificar Progresso"
4. Atualizar código JS dos nodes existentes
5. Conectar novos nodes conforme diagrama em `ENHANCED_FEATURES.md`

### 7. **Testar Funcionalidades**

#### Teste 1: Conexão WebSocket

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('✅ WebSocket conectado');
  ws.send(JSON.stringify({ type: 'ping' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Recebido:', data); // { type: 'pong' }
};
```

#### Teste 2: Criar Campanha

```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste v3.0",
    "contacts": [
      {"nome": "João", "telefone": "11999999999"}
    ],
    "config": {
      "systemPrompt": "Olá {{nome}}!",
      "delayMin": 140,
      "delayMax": 380
    }
  }'
```

#### Teste 3: Dashboard

```bash
curl -X GET http://localhost:5000/api/campaigns/dashboard \
  -H "Authorization: Bearer <seu-token>"
```

#### Teste 4: Métricas

```bash
curl -X GET http://localhost:5000/api/campaigns/<campaign-id>/metrics \
  -H "Authorization: Bearer <seu-token>"
```

---

## 🆕 Novos Endpoints Disponíveis

### Analytics e Métricas

```
GET /api/campaigns/dashboard          - Dashboard do usuário
GET /api/campaigns/:id/metrics        - Métricas da campanha
GET /api/campaigns/:id/performance    - Análise de performance
GET /api/campaigns/:id/export         - Exportar relatório completo
```

### WebSocket

```
WS /ws                                - Conexão WebSocket

Eventos:
- subscribe_user                      - Inscrever para atualizações do usuário
- subscribe_campaign                  - Inscrever para atualizações da campanha
- unsubscribe_campaign                - Cancelar inscrição
- ping                                - Teste de conexão
```

---

## 🔄 Mudanças Breaking

### 1. **Estrutura de Resposta**

**Antes (v2.0):**
```json
{
  "success": true,
  "campaign": { ... }
}
```

**Agora (v3.0):**
```json
{
  "success": true,
  "campaign": { ... },
  "rateLimitRemaining": 58
}
```

### 2. **Validação Mais Rigorosa**

Agora valida:
- Nome da campanha (1-255 chars)
- Máximo 10.000 contatos por campanha
- Formato de telefone
- URLs válidas
- Delays entre 0-3600s

### 3. **Rate Limiting**

- Máximo 60 requisições/minuto
- HTTP 429 quando excedido
- Header `Retry-After` indica tempo de espera

**Exemplo de tratamento:**
```javascript
fetch('/api/campaigns', { ... })
  .then(res => {
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      alert(`Aguarde ${retryAfter}s`);
    }
    return res.json();
  });
```

---

## 📊 Monitoramento

### Logs

Os logs agora são gravados em arquivos:

```bash
# Localização
backend/logs/

# Estrutura
2025-01-14-error.log    # Apenas erros
2025-01-14-info.log     # Informações gerais
2025-01-14-debug.log    # Debug detalhado

# Ver logs em tempo real
tail -f backend/logs/2025-01-14-info.log
```

### Estatísticas WebSocket

```bash
# Health check inclui stats do WebSocket
curl http://localhost:5000/health | jq .websocket

# Resposta:
{
  "totalConnections": 5,
  "subscribedUsers": 3,
  "subscribedCampaigns": 2
}
```

---

## 🐛 Troubleshooting

### Problema 1: WebSocket não conecta

**Solução:**
```bash
# Verificar se porta 5000 está aberta
netstat -an | grep 5000

# Verificar firewall
sudo ufw allow 5000

# Verificar logs
tail -f backend/logs/2025-01-14-error.log
```

### Problema 2: Migration falha

**Solução:**
```bash
# Verificar versão do PostgreSQL
psql --version

# Executar migration manualmente
psql -U postgres -d prismatech_campaign -f backend/migrations/004_campaign_events.sql

# Verificar se tabela foi criada
psql -U postgres -d prismatech_campaign -c "\dt campaign_events"
```

### Problema 3: Rate limit muito restritivo

**Solução:**
```javascript
// Ajustar em backend/src/services/rateLimiter.js
this.config = {
  maxRequestsPerMinute: 100,  // Aumentar de 60 para 100
  maxConcurrentCampaigns: 10, // Aumentar de 5 para 10
  ...
};
```

### Problema 4: Logs ocupando muito espaço

**Solução:**
```bash
# Criar rotação de logs
# Adicionar em crontab: crontab -e
0 0 * * * find /path/to/backend/logs -name "*.log" -mtime +30 -delete

# Ou usar logrotate
sudo nano /etc/logrotate.d/rapidflow
```

---

## ✅ Checklist de Upgrade

- [ ] Backup do banco de dados feito
- [ ] Dependência `ws` instalada
- [ ] Servidor iniciado sem erros
- [ ] Health check retorna status OK
- [ ] WebSocket funcionando (teste de ping/pong)
- [ ] Migration 004 executada com sucesso
- [ ] Workflow n8n atualizado
- [ ] Teste de criação de campanha OK
- [ ] Dashboard retorna dados
- [ ] Métricas funcionando
- [ ] Logs sendo gravados em arquivos
- [ ] Rate limiting funcionando

---

## 📚 Recursos Adicionais

- [Documentação Completa](./ENHANCED_FEATURES.md)
- [Workflow n8n](./workflows/enhanced-campaign-workflow.json)
- [Código Fonte Backend](./backend/src/)

---

## 🆘 Suporte

Se encontrar problemas:

1. Verificar logs: `backend/logs/`
2. Verificar health check: `curl http://localhost:5000/health`
3. Verificar migrations: `psql -d prismatech_campaign -c "\dt"`
4. Revisar documentação: `ENHANCED_FEATURES.md`

---

**Boa sorte com o upgrade! 🚀**

_Desenvolvido por RapidFlow Team_
