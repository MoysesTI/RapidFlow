const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURAÇÃO BÁSICA
// ═══════════════════════════════════════════════════════════
app.set('trust proxy', 1);
app.disable('x-powered-by');

console.log('🚀 Iniciando RapidFlow Backend...');

// ═══════════════════════════════════════════════════════════
// 2. VALIDAÇÕES DE AMBIENTE
// ═══════════════════════════════════════════════════════════
const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    console.error('❌ ERRO: Variáveis faltando:', missing.join(', '));
    console.error('Configure no Render: Environment Variables');
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 20) {
    console.error('❌ JWT_SECRET muito curto (min 20 chars)');
    process.exit(1);
}

console.log('✅ Variáveis de ambiente validadas');

// ═══════════════════════════════════════════════════════════
// 3. CORS - CONFIGURAÇÃO ROBUSTA
// ═══════════════════════════════════════════════════════════
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

console.log('🌐 CORS Origins:', allowedOrigins);

// CORS simples e funcional
app.use(cors({
    origin: function (origin, callback) {
        // Permitir requests sem origin (Postman, curl)
        if (!origin) return callback(null, true);
        
        // Verificar se está na lista
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        
        // Em desenvolvimento, permitir qualquer origin
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        console.warn('🚫 CORS bloqueou:', origin);
        callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 horas
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

// Garantir que OPTIONS sempre funciona
app.options('*', cors());

// ═══════════════════════════════════════════════════════════
// 4. MIDDLEWARE BÁSICO
// ═══════════════════════════════════════════════════════════
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logs apenas em dev
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Rate limiting moderado
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ═══════════════════════════════════════════════════════════
// 5. HEALTH CHECK (ANTES DE CARREGAR ROTAS)
// ═══════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'development',
        cors: allowedOrigins,
        version: '2.3.0'
    });
});

// ═══════════════════════════════════════════════════════════
// 6. CARREGAR ROTAS (COM TRY-CATCH)
// ═══════════════════════════════════════════════════════════
let authRoutes, configRoutes, campaignRoutes;

try {
    authRoutes = require('./routes/auth');
    configRoutes = require('./routes/config');
    campaignRoutes = require('./routes/campaigns');
    console.log('✅ Rotas carregadas');
} catch (error) {
    console.error('❌ Erro ao carregar rotas:', error.message);
    process.exit(1);
}

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/campaigns', campaignRoutes);

// ═══════════════════════════════════════════════════════════
// 7. ERROR HANDLERS
// ═══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    
    // Garantir que CORS está nos headers mesmo em erro
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.status(err.status || 500).json({
        error: true,
        message: process.env.NODE_ENV === 'production' 
            ? 'Erro interno do servidor' 
            : err.message
    });
});

app.use((req, res) => {
    res.status(404).json({
        error: true,
        message: 'Rota não encontrada',
        path: req.path
    });
});

// ═══════════════════════════════════════════════════════════
// 8. INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════
async function startServer() {
    try {
        // Importar database apenas quando necessário
        const { pool } = require('./config/database');
        const { runMigrations } = require('./auto-migration');
        
        console.log('🔌 Conectando ao banco...');
        await pool.query('SELECT NOW()');
        console.log('✅ PostgreSQL conectado');
        
        console.log('🔧 Executando migrations...');
        await runMigrations();
        console.log('✅ Banco configurado');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n╔════════════════════════════════════════╗');
            console.log('║   ✅ SERVIDOR RODANDO COM SUCESSO!   ║');
            console.log('╚════════════════════════════════════════╝');
            console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔒 CORS: ${allowedOrigins.join(', ')}`);
            console.log(`🔑 JWT: ${process.env.JWT_SECRET.substring(0, 10)}...`);
            console.log('');
        });
        
    } catch (error) {
        console.error('\n❌ ERRO CRÍTICO ao iniciar:');
        console.error(error);
        console.error('\nStack:', error.stack);
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════
// 9. HANDLERS DE ERROS GLOBAIS
// ═══════════════════════════════════════════════════════════
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('💥 Unhandled Rejection:', error);
    process.exit(1);
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM recebido, encerrando...');
    process.exit(0);
});

// INICIAR
startServer();