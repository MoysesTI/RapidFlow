# 🚀 RapidFlow - Automação Inteligente para Campanhas em Massa

![RapidFlow](https://img.shields.io/badge/Status-Ativo-success)
![Node](https://img.shields.io/badge/Node-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)

Sistema completo de automação para envio de mensagens em massa com personalização via IA.

## ✨ Funcionalidades

- 📱 **Envios em Lote**: Processe milhares de mensagens automaticamente
- 🤖 **IA Personalizada**: Mensagens únicas geradas com OpenAI
- ⚙️ **Integração Evolution API**: Conexão direta com WhatsApp
- 📊 **Dashboard em Tempo Real**: Acompanhe suas campanhas
- 👥 **Gerenciamento de Usuários**: Sistema multiusuário com autenticação JWT
- 📈 **Logs e Métricas**: Rastreamento completo de campanhas

## 🏗️ Tecnologias

### Backend
- Node.js 18+
- Express.js
- PostgreSQL
- JWT Authentication
- Bcrypt

### Frontend
- HTML5 / CSS3
- JavaScript (Vanilla)
- Design Moderno e Responsivo

## 📦 Instalação Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL 15+
- npm ou yarn

### 1. Clone o repositório
```bash
git clone https://github.com/MoysesTI/RapidFlow.git
cd RapidFlow
```

### 2. Configure o Backend
```bash
cd backend
npm install
```

### 3. Configure o Banco de Dados
```bash
# Criar banco de dados
createdb rapidflow

# Executar migrations
psql -U postgres -d rapidflow -f migrations/001_schema.sql
```

### 4. Configure as variáveis de ambiente
Crie um arquivo `.env` no diretório `backend/`:
```env
# Servidor
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rapidflow
DB_USER=postgres
DB_PASSWORD=sua_senha

# JWT
JWT_SECRET=sua_chave_secreta_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Evolution API (opcional)
DEFAULT_EVOLUTION_ENDPOINT=https://sua-evolution-api.com
DEFAULT_EVOLUTION_API_KEY=sua_chave_api
```

### 5. Inicie os servidores

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npx http-server -p 3000
```

### 6. Acesse o sistema
- Frontend: http://localhost:3000/login.html
- Backend API: http://localhost:5000

**Credenciais padrão:**
- Email: `admin@prismatech.com`
- Senha: `#serverprisma@dti`

## 🌐 Deploy em Produção

### Opção 1: Render (Recomendado - 100% Gratuito)

**Backend:**
1. Crie uma conta em [Render.com](https://render.com)
2. Conecte seu repositório GitHub
3. Crie um **Web Service**
4. Configure as variáveis de ambiente
5. Deploy automático!

**Banco de Dados:**
1. Crie um **PostgreSQL** no Render (gratuito)
2. Copie a URL de conexão
3. Configure no backend

**Frontend:**
1. Crie um **Static Site** no Render
2. Aponte para o diretório `frontend/`
3. Deploy!

### Opção 2: Railway

1. Acesse [Railway.app](https://railway.app)
2. Conecte seu GitHub
3. Deploy com 1 clique
4. Configure variáveis de ambiente

### Opção 3: Vercel (Frontend) + Render (Backend)

**Frontend no Vercel:**
```bash
npm i -g vercel
cd frontend
vercel
```

**Backend no Render:** (igual opção 1)

## 📚 Estrutura do Projeto
```
RapidFlow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── server.js
│   │   └── seed.js
│   ├── migrations/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── css/
│   ├── js/
│   ├── index.html
│   └── login.html
├── .gitignore
└── README.md
```

## 🔐 Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Autenticação JWT
- ✅ Proteção contra SQL Injection
- ✅ CORS configurado
- ✅ Rate limiting
- ✅ Helmet.js para headers seguros

## 🤝 Contribuindo

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add: MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Moyses**
- GitHub: [@MoysesTI](https://github.com/MoysesTI)

## 🙏 Agradecimentos

- OpenAI pela API
- Evolution API
- Comunidade Open Source

---

⭐ Se este projeto te ajudou, deixe uma estrela!
