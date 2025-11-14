# 🚀 RapidFlow Enhanced Features v3.0

## 📋 **Índice**

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Novas Features Backend](#novas-features-backend)
4. [Workflow n8n Melhorado](#workflow-n8n-melhorado)
5. [APIs e Endpoints](#apis-e-endpoints)
6. [WebSocket Real-Time](#websocket-real-time)
7. [Analytics e Métricas](#analytics-e-métricas)
8. [Guia de Implementação](#guia-de-implementação)

---

## 🎯 **Visão Geral**

O RapidFlow v3.0 traz melhorias significativas em:

- ✅ **Notificações em Tempo Real** via WebSocket
- ✅ **Analytics Avançado** com métricas detalhadas
- ✅ **Rate Limiting Inteligente** para proteger APIs
- ✅ **Validação Robusta** de dados
- ✅ **Retry com Exponential Backoff**
- ✅ **Circuit Breaker** para proteção contra falhas
- ✅ **Logging Estruturado** para debugging
- ✅ **Health Score** de campanhas

---

## 🏗️ **Arquitetura**

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ├─── HTTP REST ────────────────┐
         │                               │
         └─── WebSocket ────────────┐   │
                                     │   │
                            ┌────────▼───▼────────┐
                            │   Backend Server    │
                            │   (Express + WS)    │
                            └──────────┬──────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
            ┌───────▼────────┐ ┌──────▼─────┐  ┌────────▼────────┐
            │   PostgreSQL   │ │   n8n      │  │   Evolution     │
            │   (Database)   │ │ (Workflow) │  │   (WhatsApp)    │
            └────────────────┘ └────────────┘  └─────────────────┘
```

---

## 🆕 **Novas Features Backend**

### 1. **WebSocket Service** (`/backend/src/services/websocket.js`)

Notificações em tempo real para o frontend.

**Eventos Suportados:**
- `campaign_created` - Campanha criada
- `campaign_started` - Campanha iniciada
- `message_sent` - Mensagem enviada com sucesso
- `message_error` - Erro no envio
- `progress` - Atualização de progresso
- `campaign_complete` - Campanha finalizada

**Exemplo de Uso (Frontend):**
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  // Inscrever-se para receber atualizações
  ws.send(JSON.stringify({
    type: 'subscribe_campaign',
    campaignId: 'CAMP-123'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  switch(data.type) {
    case 'campaign_update':
      console.log('Atualização:', data.data);
      // Atualizar UI com progresso em tempo real
      break;
  }
};
```

### 2. **Analytics Service** (`/backend/src/services/analytics.js`)

Métricas e analytics detalhados de campanhas.

**Funcionalidades:**
- Cálculo de métricas em tempo real
- Dashboard agregado do usuário
- Análise de performance por hora
- Top erros mais comuns
- Health Score (0-100)
- Exportação de relatórios completos

**Métricas Calculadas:**
- Taxa de sucesso
- Taxa de erro
- Velocidade de envio (msgs/min)
- Tempo estimado de conclusão
- Progresso percentual

### 3. **Rate Limiter Service** (`/backend/src/services/rateLimiter.js`)

Controle de taxa inteligente.

**Limites:**
- Máximo 60 requisições/minuto por usuário
- Máximo 5 campanhas concorrentes
- Máximo 2 mensagens/segundo por campanha
- Burst limit de 10 mensagens/segundo

**Características:**
- Sliding window algorithm
- Cálculo de delay recomendado
- Cleanup automático de janelas antigas

### 4. **Logger Service** (`/backend/src/services/logger.js`)

Logging estruturado com níveis.

**Níveis:**
- `ERROR` - Erros críticos
- `WARN` - Avisos
- `INFO` - Informações gerais
- `DEBUG` - Debug detalhado

**Features:**
- Logs coloridos no console
- Gravação em arquivos por nível
- Logs específicos de campanha
- Métricas de performance
- Captura de erros não tratados

### 5. **Validation Middleware** (`/backend/src/middleware/validation.js`)

Validação robusta de dados de entrada.

**Validações:**
- Nome da campanha (1-255 chars)
- Lista de contatos (1-10.000)
- Formato de telefone brasileiro
- URLs válidas
- Delays (0-3600s)
- Modelos OpenAI suportados

---

## 🔄 **Workflow n8n Melhorado**

### **Principais Melhorias:**

#### 1. **Validação de Entrada**
```javascript
// Valida todos os contatos antes de processar
- Verifica nome não vazio
- Valida formato de telefone
- Normaliza números (adiciona +55)
- Remove contatos inválidos
- Loga contatos problemáticos
```

#### 2. **Circuit Breaker**
```javascript
// Proteção contra cascata de falhas
if (consecutiveErrors > 5) {
  circuitBreakerOpen = true;
  // Para de enviar para prevenir ban
}
```

#### 3. **Retry com Exponential Backoff**
```javascript
// Retry inteligente
retryDelay = 2000 * Math.pow(2, retryNumber - 1)
// Retry 1: 2s
// Retry 2: 4s
// Retry 3: 8s
// Retry 4: 16s
// Retry 5: 32s
```

#### 4. **Progress Tracking**
```javascript
// Notifica backend a cada 5 mensagens
if (messageCount % 5 === 0 || isLast) {
  notifyProgress({
    currentPosition,
    sent,
    errors,
    progressPercentage
  });
}
```

#### 5. **Health Checks**
```javascript
// Teste de conexão
POST /webhook { test: true }
// Resposta:
{
  success: true,
  version: '3.0',
  features: ['WebSocket', 'Analytics', ...]
}
```

---

## 📡 **APIs e Endpoints**

### **Endpoints Protegidos** (requerem JWT)

#### 1. Criar Campanha
```http
POST /api/campaigns
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Campanha Teste",
  "contacts": [
    { "nome": "João", "telefone": "11999999999" }
  ],
  "config": {
    "imageUrl": "https://...",
    "systemPrompt": "Olá {{nome}}!",
    "delayMin": 140,
    "delayMax": 380
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "campaign": {
    "id": 1,
    "campaign_id": "CAMP-123",
    "name": "Campanha Teste",
    "status": "pending"
  },
  "rateLimitRemaining": 58
}
```

#### 2. Dashboard do Usuário
```http
GET /api/campaigns/dashboard
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "dashboard": {
    "summary": {
      "total_campaigns": 10,
      "completed_campaigns": 8,
      "running_campaigns": 1,
      "avg_success_rate": 95.5
    },
    "recent_campaigns": [...],
    "daily_performance": [...]
  }
}
```

#### 3. Métricas de Campanha
```http
GET /api/campaigns/:id/metrics
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "metrics": {
    "campaign_id": "CAMP-123",
    "status": "running",
    "total_contacts": 100,
    "sent_count": 50,
    "error_count": 2,
    "progress_percentage": 50,
    "messages_per_minute": 2.5,
    "estimated_seconds_remaining": 1200,
    "health_score": 95
  }
}
```

#### 4. Performance Analysis
```http
GET /api/campaigns/:id/performance
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "performance": {
    "hourly_analysis": [
      { "hour": 14, "total": 50, "sent": 48, "success_rate": 96 }
    ],
    "top_errors": [
      { "error_message": "Timeout", "count": 5, "percentage": 50 }
    ],
    "timing_stats": {
      "avg_send_time_seconds": 1.2,
      "min_send_time_seconds": 0.5,
      "max_send_time_seconds": 3.0
    }
  }
}
```

#### 5. Exportar Relatório
```http
GET /api/campaigns/:id/export
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "success": true,
  "report": {
    "campaign": { ... },
    "performance": { ... },
    "messages": [ ... ],
    "generated_at": "2025-01-..."
  }
}
```

### **Endpoints de Callback** (n8n)

#### 1. Atualizar Status de Mensagem
```http
POST /api/campaigns/:id/update-status
Content-Type: application/json

{
  "contactName": "João",
  "phone": "5511999999999",
  "status": "sent",
  "messageText": "Olá João!"
}
```

#### 2. Atualizar Progresso
```http
POST /api/campaigns/:id/progress
Content-Type: application/json

{
  "currentPosition": 50,
  "sent": 48,
  "errors": 2
}
```

#### 3. Finalizar Campanha
```http
POST /api/campaigns/:id/complete
Content-Type: application/json

{
  "totalSent": 98,
  "totalErrors": 2
}
```

---

## 🔌 **WebSocket Real-Time**

### **Conexão**

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  console.log('✅ Conectado ao WebSocket');

  // Inscrever para receber atualizações do usuário
  ws.send(JSON.stringify({
    type: 'subscribe_user',
    userId: 123
  }));

  // Inscrever para campanha específica
  ws.send(JSON.stringify({
    type: 'subscribe_campaign',
    campaignId: 'CAMP-123'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  handleWebSocketMessage(message);
};

ws.onerror = (error) => {
  console.error('❌ Erro WebSocket:', error);
};

ws.onclose = () => {
  console.log('🔌 Desconectado');
  // Implementar reconexão automática
  setTimeout(() => reconnect(), 5000);
};
```

### **Mensagens Recebidas**

#### Campanha Criada
```json
{
  "type": "campaign_update",
  "campaignId": "CAMP-123",
  "data": {
    "event": "campaign_created",
    "campaign": { ... }
  },
  "timestamp": "2025-..."
}
```

#### Mensagem Enviada
```json
{
  "type": "campaign_update",
  "campaignId": "CAMP-123",
  "data": {
    "event": "message_sent",
    "contactName": "João",
    "phone": "5511999999999",
    "messageText": "Olá João!"
  }
}
```

#### Progresso Atualizado
```json
{
  "type": "campaign_update",
  "campaignId": "CAMP-123",
  "data": {
    "event": "progress",
    "currentPosition": 50,
    "totalContacts": 100,
    "progressPercentage": 50
  }
}
```

#### Campanha Concluída
```json
{
  "type": "campaign_update",
  "campaignId": "CAMP-123",
  "data": {
    "event": "campaign_complete",
    "totalSent": 98,
    "totalErrors": 2,
    "successRate": 98,
    "duration": 1200
  }
}
```

---

## 📊 **Analytics e Métricas**

### **Health Score (0-100)**

Algoritmo de cálculo:

```javascript
let score = 100;

// Penalidades
if (errorRate > 10%) score -= 30;
else if (errorRate > 5%) score -= 15;
else if (errorRate > 2%) score -= 5;

if (successRate < 70%) score -= 25;
else if (successRate < 85%) score -= 10;

if (messagesPerMinute < 0.5) score -= 15;

// Bônus
if (status === 'completed' && successRate > 95%) score += 10;

return Math.max(0, Math.min(100, score));
```

**Interpretação:**
- **90-100**: Excelente ✅
- **70-89**: Bom 👍
- **50-69**: Moderado ⚠️
- **0-49**: Ruim ❌

### **Métricas Disponíveis**

#### Por Campanha:
- Total de contatos
- Mensagens enviadas
- Taxa de erro
- Taxa de sucesso
- Velocidade (msgs/min)
- Tempo estimado restante
- Progresso percentual
- Duração total

#### Agregadas (Dashboard):
- Total de campanhas
- Campanhas completas/em andamento
- Taxa média de sucesso
- Performance diária (últimos 30 dias)
- Campanhas recentes

#### Análise de Performance:
- Distribuição por hora do dia
- Top 10 erros mais comuns
- Tempo médio/min/max de envio

---

## 🛠️ **Guia de Implementação**

### **1. Instalar Dependências**

```bash
cd backend
npm install ws
# As outras dependências já estão no package.json
```

### **2. Executar Migrations**

As migrations são executadas automaticamente na inicialização do servidor.

Migrations incluídas:
- `001_schema.sql` - Schema principal
- `002_add_contacts_column.sql` - Coluna de contatos
- `003_campaign_logs.sql` - Logs de mensagens
- `004_campaign_events.sql` - **NOVA** - Eventos e analytics

### **3. Configurar n8n**

1. Importar o workflow `enhanced-campaign-workflow.json`
2. Configurar credenciais OpenAI
3. Atualizar URL do webhook
4. Ativar o workflow

### **4. Testar Sistema**

#### Teste de Conexão:
```bash
curl -X POST http://localhost:5000/webhook/prisma-campaign \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### Teste de Campanha:
```bash
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "contacts": [
      {"nome": "Teste", "telefone": "11999999999"}
    ],
    "config": {}
  }'
```

#### Teste WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:5000/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'ping' }));
};
ws.onmessage = (event) => {
  console.log(JSON.parse(event.data)); // { type: 'pong' }
};
```

### **5. Monitoramento**

#### Health Check:
```bash
curl http://localhost:5000/health
```

**Resposta:**
```json
{
  "status": "OK",
  "timestamp": "2025-...",
  "uptime": 3600,
  "version": "3.0.0",
  "websocket": {
    "totalConnections": 5,
    "subscribedUsers": 3,
    "subscribedCampaigns": 2
  }
}
```

#### Logs:
```bash
# Logs são gravados em backend/logs/
ls backend/logs/

# Exemplo:
2025-01-14-error.log
2025-01-14-info.log
2025-01-14-debug.log
```

---

## 🎯 **Melhores Práticas**

### **Frontend**

1. **Implementar Reconexão WebSocket**
```javascript
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;

function connect() {
  const ws = new WebSocket('ws://...');

  ws.onclose = () => {
    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setTimeout(connect, delay);
    }
  };

  ws.onopen = () => {
    reconnectAttempts = 0;
  };
}
```

2. **Usar Analytics para UX**
```javascript
// Mostrar progresso em tempo real
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);

  if (type === 'campaign_update' && data.event === 'progress') {
    updateProgressBar(data.progressPercentage);
    showETA(data.estimated_seconds_remaining);
  }
};
```

3. **Implementar Rate Limit Handling**
```javascript
fetch('/api/campaigns', {
  method: 'POST',
  body: JSON.stringify(data)
})
.then(res => {
  if (res.status === 429) {
    // Rate limit excedido
    const resetIn = res.headers.get('Retry-After');
    showMessage(`Aguarde ${resetIn}s`);
  }
  return res.json();
});
```

### **Backend**

1. **Sempre usar Logger**
```javascript
logger.info('Campanha criada', { campaignId, userId });
logger.error('Erro ao enviar', { error: e.message });
```

2. **Validar Dados**
```javascript
// Usar middleware de validação em todas as rotas
router.post('/', validateCampaignPayload, createCampaign);
```

3. **Monitorar WebSocket**
```javascript
// Verificar estatísticas periodicamente
const stats = websocketService.getStats();
logger.info('WS Stats', stats);
```

---

## 📈 **Próximos Passos**

### **Possíveis Melhorias Futuras:**

1. **Redis para Rate Limiting**
   - Substituir Map em memória por Redis
   - Rate limiting distribuído

2. **Queue System (Bull/BullMQ)**
   - Processar campanhas em fila
   - Priorização de campanhas
   - Retry automático

3. **Prometheus + Grafana**
   - Métricas em tempo real
   - Dashboards customizados
   - Alertas automáticos

4. **Multi-tenancy**
   - Isolamento por tenant
   - Limites por plano
   - Billing integrado

5. **A/B Testing**
   - Testar múltiplas mensagens
   - Análise de conversão
   - Otimização automática

---

## 📝 **Changelog**

### v3.0.0 (2025-01-14)
- ✅ WebSocket para notificações em tempo real
- ✅ Analytics service completo
- ✅ Rate limiter inteligente
- ✅ Validação robusta de dados
- ✅ Logging estruturado
- ✅ Circuit breaker no workflow
- ✅ Retry com exponential backoff
- ✅ Health score de campanhas
- ✅ Endpoints de analytics
- ✅ Migration system aprimorado

---

## 🤝 **Suporte**

Para dúvidas ou problemas:

1. Verificar logs em `backend/logs/`
2. Verificar health check: `GET /health`
3. Verificar WebSocket stats no health check
4. Revisar documentação de cada serviço

---

**Desenvolvido com ❤️ por RapidFlow Team**
