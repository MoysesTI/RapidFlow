# 🔒 GUIA DE SEGURANÇA - RAPIDFLOW

## ⚠️ REGRAS CRÍTICAS

### 1. NUNCA COMMITAR
- ❌ `.env` (senhas, tokens, API keys)
- ❌ Credenciais de banco de dados
- ❌ JWT secrets
- ❌ Arquivos de backup com dados sensíveis

### 2. SEMPRE USAR .gitignore
Certifique-se que `.gitignore` contém:
```
.env
*.env
node_modules/
*.backup
secrets.json
```

### 3. VARIÁVEIS DE AMBIENTE
Configure no Render.com:
- `JWT_SECRET` (min 32 caracteres)
- `DB_PASSWORD` (senha forte)
- `CORS_ORIGIN` (apenas domínios confiáveis)

## 🛡️ CONFIGURAÇÃO NO RENDER

### Backend (Environment Variables):
```
NODE_ENV=production
PORT=5000
DB_HOST=dpg-xxxxx.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=rapidflow
DB_PASSWORD=senha-segura-aqui
DB_SSL=true
JWT_SECRET=chave-aleatoria-minimo-32-caracteres
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://rapidflow-frontend.onrender.com
```

### Frontend (Environment Variables):
```
REACT_APP_API_URL=https://rapidflow-backend.onrender.com/api
```

## 🔐 BOAS PRÁTICAS

### Senhas Fortes
- ✅ Mínimo 12 caracteres
- ✅ Letras maiúsculas e minúsculas
- ✅ Números e símbolos
- ❌ Não usar palavras comuns

### JWT Secret
Gere um aleatório:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### CORS
- ✅ Liste APENAS domínios confiáveis
- ❌ Não use `*` em produção
- ✅ Use HTTPS

## 🚨 SE CREDENCIAIS VAZARAM

1. **Trocar IMEDIATAMENTE:**
   - Senha do banco de dados
   - JWT secret
   - API keys

2. **Invalidar tokens:**
   - Trocar JWT_SECRET força logout de todos

3. **Monitorar:**
   - Logs de acesso
   - Requisições suspeitas

## 📊 CHECKLIST DE SEGURANÇA

- [ ] `.env` não está no Git
- [ ] `.gitignore` configurado
- [ ] Variáveis no Render configuradas
- [ ] JWT_SECRET forte (32+ chars)
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] HTTPS em produção
- [ ] Senhas fortes
- [ ] GitHub público sem segredos

## 🔗 LINKS ÚTEIS

- [Render Environment Variables](https://render.com/docs/environment-variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)