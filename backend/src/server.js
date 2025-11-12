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

// ===== CORS CONFIGURATION =====
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : ['http://localhost:3000', 'http://127.0.0.1:3000'];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// ===== MIDDLEWARE =====
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use('/api/', limiter);

// ===== ROUTES =====
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        cors: allowedOrigins
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/campaigns', campaignRoutes);

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
    console.error('Erro:', err);
    res.status(err.status || 500).json({
        error: true,
        message: err.message || 'Erro interno do servidor'
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
        // Testar conexão com banco
        await pool.query('SELECT NOW()');
        console.log('✅ Conectado ao PostgreSQL');
        
        // Executar migrations automaticamente
        await runMigrations();
        
        console.log('✅ Banco de dados configurado');
        
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ===================================');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🚀 URL: http://localhost:${PORT}`);
            console.log(`🚀 CORS habilitado para: ${allowedOrigins.join(', ')}`);
            console.log('🚀 ===================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
