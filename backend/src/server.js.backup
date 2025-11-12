const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool } = require('./config/database');
const authRoutes = require('./routes/auth');
const configRoutes = require('./routes/config');
const campaignRoutes = require('./routes/campaigns');

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // 100 requisições por IP
});
app.use('/api/', limiter);

// ===== ROUTES =====
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
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
        console.log('✅ Banco de dados conectado');
        
        app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ===================================');
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
            console.log(`🚀 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🚀 URL: http://localhost:${PORT}`);
            console.log('🚀 ===================================');
            console.log('');
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
