const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { pool } = require('./config/database');
const { runMigrations } = require('./auto-migration');
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const campaignRoutes = require('./routes/campaigns');

// Importar segurança
const {
    apiLimiter,
    helmetConfig,
    validateJWTSecret,
    validateEnvVariables
} = require('./middleware/security');

const app = express();

// Validar ambiente ANTES de iniciar
validateEnvVariables();
validateJWTSecret();

app.set('trust proxy', 1);
app.disable('x-powered-by');
const PORT = process.env.PORT || 5000;

// ===== CORS CONFIGURATION =====
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [];

if (allowedOrigins.length === 0 && process.env.NODE_ENV === 'production') {
    console.error('⚠️  AVISO: CORS_ORIGIN não configurado em produção!');
}

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir requests sem origin (mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            console.warn('🚫 CORS bloqueou:', origin);
            callback(new Error('Origem não permitida pelo CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400 // 24 horas
};

// ===== MIDDLEWARE =====
app.use(helmetConfig);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logs apenas em dev
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// ===== ROUTES =====
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/campaigns', campaignRoutes);

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    // Não expor detalhes em produção
    const isDev = process.env.NODE_ENV !== 'production';
    
    console.error('❌ Erro:', err);
    
    res.status(err.status || 500).json({
        error: true,
        message: isDev ? err.message : 'Erro interno do servidor',
        ...(isDev && { stack: err.stack })
    });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
    res.status(404).json({
        error: true,
        message: 'Rota não encontrada'
    });
});

// ===== INICIAR SERVIDOR =====
async function startServer() {
    try {
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado ao PostgreSQL');
        
        await runMigrations();
        console.log('✅ Banco de dados configurado');
        
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ===================================');
            console.log(`🚀 Servidor: http://localhost:${PORT}`);
            console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🚀 CORS: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'TODOS (dev)'}`);
            console.log('🚀 ===================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();