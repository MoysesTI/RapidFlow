const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool } = require('./config/database');
const { runMigrations } = require('./auto-migration');
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const campaignRoutes = require('./routes/campaigns');

const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// VALIDAÇÕES DE AMBIENTE
// ═══════════════════════════════════════════════════════════
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
    console.error('❌ ERRO: Variáveis faltando:', missingVars);
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ ERRO: JWT_SECRET deve ter 32+ caracteres');
    process.exit(1);
}

console.log('✅ Validações de ambiente OK');

// ═══════════════════════════════════════════════════════════
// CORS CONFIGURATION
// ═══════════════════════════════════════════════════════════
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [];

console.log('🌐 CORS configurado para:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sem origin (Postman, mobile apps)
        if (!origin) {
            console.log('✅ Request sem origin (permitido)');
            return callback(null, true);
        }
        
        // Verificar se origin está na lista
        if (allowedOrigins.includes(origin)) {
            console.log('✅ CORS OK:', origin);
            callback(null, true);
        } else {
            console.warn('🚫 CORS bloqueou:', origin);
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
    maxAge: 86400
};

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE
// ═══════════════════════════════════════════════════════════
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Desabilitar temporariamente para debug
}));

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight para todas as rotas

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logs detalhados
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.get('origin') || 'none'}`);
    next();
});

if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ═══════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV,
        cors: allowedOrigins
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/campaigns', campaignRoutes);

// ═══════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err.message);
    console.error('Stack:', err.stack);
    
    // CORS error
    if (err.message.includes('CORS')) {
        return res.status(403).json({
            error: true,
            message: 'Origem não permitida pelo CORS',
            origin: req.get('origin')
        });
    }
    
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
        message: 'Rota não encontrada'
    });
});

// ═══════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════
async function startServer() {
    try {
        console.log('🔌 Conectando ao banco...');
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado ao PostgreSQL');
        
        console.log('🔧 Executando migrations...');
        await runMigrations();
        console.log('✅ Banco de dados configurado');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log('');
            console.log('🚀 ════════════════════════════════════');
            console.log(`🚀 Servidor: http://0.0.0.0:${PORT}`);
            console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🚀 CORS: ${allowedOrigins.join(', ')}`);
            console.log(`🚀 JWT_SECRET: ${process.env.JWT_SECRET.substring(0, 10)}...`);
            console.log('🚀 ════════════════════════════════════');
            console.log('');
        });
    } catch (error) {
        console.error('❌ ERRO CRÍTICO ao iniciar servidor:');
        console.error(error);
        process.exit(1);
    }
}

// Handlers de erros não capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (error) => {
    console.error('❌ Unhandled Rejection:', error);
    process.exit(1);
});

startServer();