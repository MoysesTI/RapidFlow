# 🚀 RapidFlow v3.0 - Enhanced Campaign Manager

<div align="center">

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Sistema completo de gerenciamento de campanhas de WhatsApp com IA, Analytics e Notificações em Tempo Real**

[Documentação Completa](./ENHANCED_FEATURES.md) • [Guia de Upgrade](./UPGRADE_GUIDE.md) • [Workflow n8n](./workflows/)

</div>

---

## ✨ Novidades v3.0

### 🔥 Principais Features

| Feature | Descrição |
|---------|-----------|
| 🔌 **WebSocket Real-Time** | Notificações instantâneas de progresso via WebSocket |
| 📊 **Analytics Avançado** | Métricas detalhadas, health score e dashboards |
| 🛡️ **Rate Limiting** | Proteção inteligente contra sobrecarga |
| ✅ **Validação Robusta** | Validação completa de dados de entrada |
| 🔄 **Retry Inteligente** | Exponential backoff com circuit breaker |
| 📝 **Logging Estruturado** | Logs organizados por nível e data |
| ⚡ **Performance** | Otimizações e monitoramento em tempo real |

---

## 🏗️ Arquitetura

```
Frontend (React)
    │
    ├── HTTP REST API ──────────┐
    └── WebSocket (Real-Time) ──┤
                                │
                        Backend (Express + WS)
                                │
                ┌───────────────┼───────────────┐
                │               │               │
            PostgreSQL        n8n         Evolution API
            (Database)    (Workflow)      (WhatsApp)
```

---

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd backend
npm install
```

### 2. Configurar Ambiente

```bash
cp .env.example .env
nano .env

# Configurar:
DB_HOST=localhost
DB_NAME=prismatech_campaign
DB_USER=postgres
DB_PASSWORD=sua_senha
JWT_SECRET=seu_secret_muito_seguro
```

### 3. Iniciar Servidor

```bash
npm start

# Você verá:
# ✅ PostgreSQL conectado
# ✅ Migrations executadas
# ✅ WebSocket inicializado
# 🌐 HTTP: http://0.0.0.0:5000
# 🔌 WebSocket: ws://0.0.0.0:5000/ws
```

### 4. Verificar Saúde

```bash
curl http://localhost:5000/health

# Resposta:
{
  "status": "OK",
  "version": "3.0.0",
  "websocket": {
    "totalConnections": 0
  }
}
```

---

## 📡 API Endpoints

### Autenticação

```http
POST /api/auth/register    - Registrar usuário
POST /api/auth/login       - Login
```

### Campanhas

```http
GET    /api/campaigns              - Listar campanhas
POST   /api/campaigns              - Criar campanha
GET    /api/campaigns/:id          - Detalhes da campanha
POST   /api/campaigns/:id/execute  - Executar campanha
GET    /api/campaigns/:id/logs     - Logs de mensagens
```

### Analytics (Novo! 🆕)

```http
GET /api/campaigns/dashboard       - Dashboard do usuário
GET /api/campaigns/:id/metrics     - Métricas detalhadas
GET /api/campaigns/:id/performance - Análise de performance
GET /api/campaigns/:id/export      - Exportar relatório
```

### WebSocket (Novo! 🆕)

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

// Inscrever para receber atualizações
ws.send(JSON.stringify({
  type: 'subscribe_campaign',
  campaignId: 'CAMP-123'
}));

// Receber atualizações em tempo real
ws.onmessage = (event) => {
  const { type, data } = JSON.parse(event.data);
  console.log('Atualização:', data);
};
```

---

## 🔧 Estrutura de Arquivos

```
RapidFlow/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── campaignController.js  (+ Analytics endpoints)
│   │   ├── services/                  (NOVO! 🆕)
│   │   │   ├── websocket.js           - WebSocket service
│   │   │   ├── analytics.js           - Analytics e métricas
│   │   │   ├── rateLimiter.js         - Rate limiting
│   │   │   └── logger.js              - Logging estruturado
│   │   ├── middleware/                (NOVO! 🆕)
│   │   │   └── validation.js          - Validação de dados
│   │   ├── routes/
│   │   │   └── campaigns.js           (+ Novos endpoints)
│   │   └── server.js                  (+ WebSocket integration)
│   ├── migrations/
│   │   └── 004_campaign_events.sql    (NOVO! 🆕)
│   └── logs/                          (NOVO! 🆕)
│       ├── 2025-01-14-error.log
│       ├── 2025-01-14-info.log
│       └── 2025-01-14-debug.log
├── workflows/
│   └── enhanced-campaign-workflow.json (NOVO! 🆕)
├── ENHANCED_FEATURES.md               (NOVO! 🆕)
├── UPGRADE_GUIDE.md                   (NOVO! 🆕)
└── README_V3.md                       (Este arquivo)
```

---

## 📊 Exemplo de Uso

### 1. Criar Campanha

```javascript
const response = await fetch('/api/campaigns', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Campanha de Ano Novo',
    contacts: [
      { nome: 'João', telefone: '11999999999' },
      { nome: 'Maria', telefone: '11988888888' }
    ],
    config: {
      imageUrl: 'https://...',
      systemPrompt: 'Olá {{nome}}! Feliz Ano Novo! 🎉',
      delayMin: 140,
      delayMax: 380,
      useAI: true
    }
  })
});

const data = await response.json();
console.log('Campanha criada:', data.campaign.campaign_id);
```

### 2. Monitorar Progresso (Real-Time)

```javascript
const ws = new WebSocket('ws://localhost:5000/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe_campaign',
    campaignId: data.campaign.campaign_id
  }));
};

ws.onmessage = (event) => {
  const { data } = JSON.parse(event.data);

  if (data.event === 'progress') {
    updateProgressBar(data.progressPercentage);
    console.log(`Progresso: ${data.progressPercentage}%`);
  }

  if (data.event === 'message_sent') {
    console.log(`✅ Enviado para ${data.contactName}`);
  }

  if (data.event === 'campaign_complete') {
    console.log('🎉 Campanha concluída!');
    console.log(`Taxa de sucesso: ${data.successRate}%`);
  }
};
```

### 3. Ver Analytics

```javascript
// Dashboard do usuário
const dashboard = await fetch('/api/campaigns/dashboard', {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());

console.log('Total de campanhas:', dashboard.summary.total_campaigns);
console.log('Taxa média de sucesso:', dashboard.summary.avg_success_rate);

// Métricas de campanha específica
const metrics = await fetch(`/api/campaigns/${campaignId}/metrics`, {
  headers: { 'Authorization': 'Bearer ' + token }
}).then(r => r.json());

console.log('Health Score:', metrics.health_score);
console.log('Progresso:', metrics.progress_percentage + '%');
console.log('Velocidade:', metrics.messages_per_minute, 'msgs/min');
```

---

## 🎯 Features Detalhadas

### WebSocket Notifications

Receba atualizações em tempo real sobre:
- Criação de campanhas
- Início de campanhas
- Mensagens enviadas
- Erros de envio
- Progresso (a cada 5 mensagens)
- Conclusão de campanhas

### Analytics Dashboard

- Resumo geral de campanhas
- Performance diária (últimos 30 dias)
- Campanhas recentes
- Taxa de sucesso média
- Total de mensagens enviadas

### Métricas de Campanha

- Progress percentage
- Taxa de erro
- Taxa de sucesso
- Velocidade de envio (msgs/min)
- Tempo estimado restante
- Health Score (0-100)

### Rate Limiting

- 60 requisições/minuto por usuário
- 5 campanhas concorrentes máximo
- 2 mensagens/segundo por campanha
- Burst limit de 10 msgs/s

### Validação Robusta

- Nome da campanha (1-255 chars)
- Máximo 10.000 contatos
- Formato de telefone válido
- URLs válidas
- Delays (0-3600s)
- Modelos OpenAI suportados

---

## 🧪 Testes

### Teste de Conexão

```bash
# WebSocket
curl http://localhost:5000/health

# n8n Webhook
curl -X POST http://localhost:5000/webhook/prisma-campaign \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Teste de Campanha

```bash
# Criar campanha de teste
curl -X POST http://localhost:5000/api/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste",
    "contacts": [{"nome": "Teste", "telefone": "11999999999"}],
    "config": {}
  }'
```

---

## 📈 Monitoramento

### Health Check

```bash
curl http://localhost:5000/health | jq
```

### Logs

```bash
# Ver logs em tempo real
tail -f backend/logs/$(date +%Y-%m-%d)-info.log

# Ver erros
tail -f backend/logs/$(date +%Y-%m-%d)-error.log

# Buscar por campanha específica
grep "CAMP-123" backend/logs/*.log
```

### WebSocket Stats

```bash
curl http://localhost:5000/health | jq .websocket
```

---

## 🔄 Workflow n8n

Importar `workflows/enhanced-campaign-workflow.json`

**Features do Workflow:**

- ✅ Validação de contatos
- ✅ Circuit breaker
- ✅ Retry com exponential backoff
- ✅ Progress tracking
- ✅ Health checks
- ✅ Logging detalhado

---

## 📚 Documentação

- [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md) - Documentação completa
- [UPGRADE_GUIDE.md](./UPGRADE_GUIDE.md) - Guia de upgrade v2 → v3
- [workflows/](./workflows/) - Workflows n8n

---

## 🛠️ Tecnologias

- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **WebSocket**: ws
- **Workflow**: n8n
- **WhatsApp**: Evolution API
- **AI**: OpenAI GPT-4

---

## 📝 Changelog

### v3.0.0 (2025-01-14)

**Novas Features:**
- ✅ WebSocket para notificações em tempo real
- ✅ Analytics service completo
- ✅ Rate limiter inteligente
- ✅ Validação robusta de dados
- ✅ Logging estruturado
- ✅ Circuit breaker no workflow
- ✅ Retry com exponential backoff
- ✅ Health score de campanhas

**Melhorias:**
- Endpoints de analytics
- Dashboard do usuário
- Análise de performance
- Exportação de relatórios
- Migration system aprimorado

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 👥 Time

Desenvolvido com ❤️ por **RapidFlow Team**

---

## 🆘 Suporte

- 📧 Email: support@rapidflow.com
- 📚 Docs: [ENHANCED_FEATURES.md](./ENHANCED_FEATURES.md)
- 🐛 Issues: [GitHub Issues](https://github.com/...)

---

<div align="center">

**[⬆ Voltar ao topo](#-rapidflow-v30---enhanced-campaign-manager)**

Made with ❤️ by RapidFlow Team

</div>
