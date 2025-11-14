# 🔧 Como Alterar o Webhook de Teste para Produção

O sistema está usando o webhook de teste porque ele está salvo nas configurações do usuário no banco de dados. Existem **3 formas** de resolver isso:

---

## ✅ Opção 1: Alterar nas Configurações (Recomendado - Mais Fácil)

### Frontend - Interface Gráfica

1. **Acesse a página de Configurações** no sistema
2. **Localize o campo "Webhook n8n"**
3. **Altere de:**
   ```
   https://box.automacaoklyon.com/webhook-test/prisma-campaign
   ```
   **Para:**
   ```
   https://webhook.automacaoklyon.com/webhook/prisma-campaign
   ```
4. **Clique em "Salvar Configurações"**
5. **Pronto!** Todas as próximas campanhas usarão o webhook de produção

**Vantagens:**
- ✅ Não precisa acessar o servidor
- ✅ Mudança permanente
- ✅ Interface amigável

---

## ✅ Opção 2: Alterar no Formulário (Temporário)

### A cada campanha criada

1. **Ao criar uma campanha**, no campo "Webhook n8n"
2. **Apague o valor atual**
3. **Digite o webhook que deseja usar:**
   - Produção: `https://webhook.automacaoklyon.com/webhook/prisma-campaign`
   - Teste: `https://box.automacaoklyon.com/webhook-test/prisma-campaign`
   - Outro: Qualquer URL que você quiser
4. **Crie a campanha normalmente**

**Vantagens:**
- ✅ Permite usar webhooks diferentes por campanha
- ✅ Flexibilidade total
- ✅ Não altera configurações padrão

**Desvantagens:**
- ❌ Precisa digitar a cada campanha

---

## ✅ Opção 3: Script de Atualização em Massa (Render.com)

### Atualizar todos os usuários de uma vez

**Via Render.com Dashboard:**

1. Acesse o **Render.com Dashboard**
2. Vá em **Web Service → RapidFlow Backend**
3. Clique em **Shell** (terminal)
4. Execute o comando:

```bash
cd backend
node update-webhook.js
```

5. O script irá:
   - Mostrar webhooks atuais
   - Atualizar de `webhook-test` para `webhook` de produção
   - Mostrar webhooks após atualização

**Saída esperada:**
```
🔄 Conectando ao banco de dados...

📋 Configurações ANTES da atualização:
┌─────────┬────────────────────────────────────┬─────────────────────────────────────────────┐
│ (index) │ user_id                            │ webhook_url                                 │
├─────────┼────────────────────────────────────┼─────────────────────────────────────────────┤
│    0    │ 'xxxx-xxxx-xxxx-xxxx'             │ '.../webhook-test/prisma-campaign'          │
└─────────┴────────────────────────────────────┴─────────────────────────────────────────────┘

🔧 Atualizando webhooks...
✅ 1 registro(s) atualizado(s)

📋 Configurações DEPOIS da atualização:
┌─────────┬────────────────────────────────────┬─────────────────────────────────────────────┐
│ (index) │ user_id                            │ webhook_url                                 │
├─────────┼────────────────────────────────────┼─────────────────────────────────────────────┤
│    0    │ 'xxxx-xxxx-xxxx-xxxx'             │ '.../webhook/prisma-campaign'               │
└─────────┴────────────────────────────────────┴─────────────────────────────────────────────┘

✅ Atualização concluída com sucesso!
```

**Vantagens:**
- ✅ Atualiza todos os usuários de uma vez
- ✅ Permanente
- ✅ Seguro (mostra antes e depois)

---

## 🎯 Qual Opção Escolher?

| Situação | Opção Recomendada |
|----------|-------------------|
| Você tem 1 usuário e quer mudar permanentemente | **Opção 1** (Configurações) |
| Você quer testar webhooks diferentes | **Opção 2** (Formulário) |
| Você tem múltiplos usuários | **Opção 3** (Script) |
| Você quer máxima flexibilidade | **Opção 2** (Formulário) |

---

## 📝 Explicação Técnica

### Por que isso acontece?

O sistema agora tem a seguinte **ordem de prioridade** para escolher o webhook:

```
1. Webhook digitado no formulário da campanha (PRIORIDADE)
2. Webhook salvo em user_configs (BACKUP)
3. Webhook do arquivo .env (DEFAULT_WEBHOOK_URL)
```

**Antes da correção:**
- ❌ Sempre usava o webhook salvo em `user_configs`
- ❌ Ignorava o que você digitava no formulário

**Depois da correção:**
- ✅ Usa o webhook do formulário (se você digitar)
- ✅ Se deixar vazio, usa o salvo em `user_configs`
- ✅ Se não houver nenhum, usa o padrão do `.env`

---

## 🚀 Webhooks Disponíveis

### Produção (Ativo 24/7)
```
https://webhook.automacaoklyon.com/webhook/prisma-campaign
```
- ✅ Sempre disponível
- ✅ Não expira
- ✅ Para campanhas reais

### Teste (Expira após 1 chamada)
```
https://box.automacaoklyon.com/webhook-test/prisma-campaign
```
- ⚠️ Precisa clicar em "Execute workflow" no n8n antes de usar
- ⚠️ Funciona apenas 1 vez
- ⚠️ Para testes apenas

### n8n Padrão (Alternativa)
```
https://webhook.automacaoklyon.com/webhook/prisma-campaign
```
- ✅ Conforme configurado no .env

---

## 🛠️ Arquivos Criados

1. **`backend/update-webhook.js`** - Script Node.js para atualizar banco
2. **`backend/migrations/002_update_webhook_url.sql`** - Migration SQL
3. **Este arquivo** - Documentação

---

## ❓ Dúvidas?

Se continuar com problemas:
1. Verifique os logs do Render para ver qual webhook está sendo usado
2. Confirme que o webhook está registrado no n8n
3. Teste o webhook diretamente com Postman/Insomnia

**Log esperado após correção:**
```
Final config: {"webhookUrl":"https://webhook.automacaoklyon.com/webhook/prisma-campaign",...}
Sending to webhook: https://webhook.automacaoklyon.com/webhook/prisma-campaign
✅ Campaign sent successfully
```

---

**Última atualização:** 2025-11-14
**Versão:** 2.3.1
