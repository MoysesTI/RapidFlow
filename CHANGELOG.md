# 📋 Changelog - RapidFlow

Todas as mudanças notáveis do projeto serão documentadas neste arquivo.

---

## [3.0.0] - 2025-11-14

### 🎉 **VERSÃO MAJOR - SISTEMA COMPLETAMENTE REFORMULADO**

### ✨ Adicionado

#### Sistema de Logs Robusto (`backend/src/utils/logger.js`)
- ✅ Logger centralizado com múltiplos níveis (debug, info, warn, error, critical)
- ✅ Logs coloridos no console (ANSI colors)
- ✅ Persistência automática em banco de dados
- ✅ Contexto de usuário e campanha
- ✅ Stack traces automáticos para erros
- ✅ Middleware para logar todas as requisições HTTP
- ✅ Suporte a diferentes tipos de log (api, webhook, n8n, auth, campaign, system)

#### Sistema de Tratamento de Erros (`backend/src/utils/errorHandler.js`)
- ✅ Classes de erro customizadas para cada situação
  - `ValidationError` (400)
  - `AuthenticationError` (401)
  - `AuthorizationError` (403)
  - `NotFoundError` (404)
  - `ConflictError` (409)
  - `RateLimitError` (429)
  - `DatabaseError` (500)
  - `ExternalServiceError` (502)
  - `WebhookError` (503)
- ✅ Normalização automática de erros
- ✅ Respostas padronizadas com detalhes apropriados
- ✅ Handlers globais para uncaught exceptions e unhandled rejections
- ✅ Wrapper `asyncHandler` para evitar try-catch manual
- ✅ Middleware de error handling centralizado

#### Novas Tabelas no Banco de Dados (`migrations/002_enhanced_logging_system.sql`)
- ✅ `n8n_webhooks` - Gerenciamento de webhooks N8N
- ✅ `campaign_messages` - Histórico completo de mensagens enviadas
- ✅ `system_logs` - Logs detalhados do sistema
- ✅ `n8n_events` - Eventos e callbacks de webhooks
- ✅ `campaign_analytics` - Métricas e analytics de campanhas
- ✅ `rate_limit_tracking` - Rastreamento de rate limiting e circuit breaker
- ✅ `n8n_configs` - Configurações específicas de N8N por usuário

#### Views do Banco de Dados
- ✅ `v_campaigns_summary` - Resumo de campanhas com analytics
- ✅ `v_recent_errors` - Logs de erros recentes
- ✅ `v_webhook_performance` - Performance de webhooks

#### Funções e Triggers
- ✅ `calculate_success_rate()` - Cálculo automático de taxas
- ✅ `update_campaign_analytics()` - Atualização automática de analytics
- ✅ `cleanup_old_logs()` - Limpeza de logs antigos (90 dias)
- ✅ Triggers automáticos para `updated_at`
- ✅ Trigger para atualizar analytics ao inserir/atualizar mensagens

#### Scripts PowerShell para Desenvolvimento Local
- ✅ `setup-local.ps1` - Setup automático do ambiente local
  - Verificação de pré-requisitos (Node.js, PostgreSQL, npm)
  - Criação automática do banco de dados
  - Execução automática de migrations
  - Instalação de dependências
  - Configuração de .env
- ✅ `start-dev.ps1` - Iniciar ambiente de desenvolvimento
  - Inicia backend, N8N e abre frontend
  - Monitoramento em tempo real dos serviços
  - Health checks automáticos
  - Jobs em background com PowerShell
- ✅ `test-local.ps1` - Suite de testes automatizados
  - Testes de health check
  - Testes de banco de dados
  - Testes de autenticação
  - Testes de API
  - Testes de integração N8N
  - Relatório de resultados

#### Workflow N8N v3.0 (`n8n-workflow-v3.0.json`)
- ✅ Validação robusta de contatos
- ✅ Circuit breaker para proteção
- ✅ Sistema de retry com exponential backoff
- ✅ Progresso em tempo real
- ✅ Callbacks para backend
- ✅ Suporte completo a IA (OpenAI)
- ✅ Logs detalhados de processamento
- ✅ Tratamento de erros aprimorado
- ✅ Notificação de progresso a cada 5 mensagens

#### Documentação
- ✅ `SETUP-LOCAL-PT.md` - Guia completo de configuração local
  - Pré-requisitos detalhados
  - Instalação passo a passo
  - Configuração de integrações
  - Suite de testes
  - Solução de problemas
  - Estrutura do projeto
- ✅ `CHANGELOG.md` - Registro de mudanças

#### Arquivo de Configuração Local
- ✅ `.env.local` - Template para desenvolvimento local
  - Configuração do PostgreSQL local (senha: 242036)
  - URLs de desenvolvimento
  - Configurações de debug
  - Flags de features

### 🔄 Modificado

#### Server.js (`backend/src/server.js`)
- ✅ Integração completa com sistema de logs
- ✅ Substituição de `console.log` por `logger`
- ✅ Middleware de logging de requisições
- ✅ Error handlers substituídos pelo sistema robusto
- ✅ Handlers globais centralizados
- ✅ Informações detalhadas de startup
- ✅ Logs de features ativadas

#### Auto-migration (`backend/src/auto-migration.js`)
- ✅ Executa automaticamente todas as migrations
- ✅ Logs melhorados
- ✅ Tratamento de erros aprimorado

#### Database Config (`backend/src/config/database.js`)
- ✅ Logs de conexão melhorados
- ✅ Error handling robusto

### 🐛 Corrigido
- ✅ Logs inconsistentes no console
- ✅ Erros não tratados de forma adequada
- ✅ Falta de rastreamento de erros
- ✅ CORS headers ausentes em erros
- ✅ Falta de retry automático
- ✅ Analytics não calculadas automaticamente

### 🚀 Melhorias de Performance
- ✅ Logging assíncrono (não bloqueia aplicação)
- ✅ Índices otimizados nas novas tabelas
- ✅ Views para consultas frequentes
- ✅ Circuit breaker para proteção contra falhas
- ✅ Rate limiting configurável

### 🔒 Segurança
- ✅ Stack traces apenas em desenvolvimento
- ✅ Credenciais de webhook encrypted (JSONB)
- ✅ Logs de auditoria completos
- ✅ Rastreamento de IP em todas as requisições
- ✅ User agent tracking

### 📊 Analytics e Monitoramento
- ✅ Métricas automáticas de campanhas
- ✅ Taxas de entrega, leitura e falhas
- ✅ Tempo médio de envio
- ✅ Contadores de mensagens por status
- ✅ Tracking de uso de IA (tokens e custo)
- ✅ Progress tracking em tempo real

### 🛠️ DevOps
- ✅ Scripts PowerShell para automação
- ✅ Setup local em um comando
- ✅ Testes automatizados
- ✅ Monitoramento de serviços em tempo real
- ✅ Health checks contínuos

---

## [2.3.0] - 2025-11-12

### 🔄 Modificado
- Configuração robusta de CORS
- Error handling melhorado
- Coluna `contacts` adicionada à tabela `campaigns`

### 🐛 Corrigido
- Erros 502 em produção
- Problema de CORS com Render
- Campo `updated_at` causando erros em UPDATEs

---

## [2.0.0] - 2025-11-10

### ✨ Adicionado
- Sistema de campanhas
- Autenticação JWT
- Upload de contatos (CSV/Excel)
- Integração com Evolution API
- Frontend responsivo

---

## Tipos de Mudanças

- `✨ Adicionado` - Novas funcionalidades
- `🔄 Modificado` - Mudanças em funcionalidades existentes
- `🐛 Corrigido` - Bug fixes
- `🗑️ Removido` - Funcionalidades removidas
- `🔒 Segurança` - Melhorias de segurança
- `📊 Analytics` - Melhorias em analytics/métricas
- `🚀 Performance` - Melhorias de performance
- `📝 Documentação` - Apenas mudanças em documentação
- `🛠️ DevOps` - Mudanças em ferramentas e processos

---

**Formato baseado em [Keep a Changelog](https://keepachangelog.com/)**
