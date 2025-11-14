const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// ═══════════════════════════════════════════════════════════
// NOVOS IMPORTS - SISTEMA ROBUSTO DE LOGS E ERRORS
// ═══════════════════════════════════════════════════════════
const { logger, requestLoggerMiddleware } = require('./utils/logger');
const {
    errorHandlerMiddleware,
    notFoundHandler,
    registerGlobalHandlers
} = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ═══════════════════════════════════════════════════════════
// 1. CONFIGURAÇÃO BÁSICA
// ═══════════════════════════════════════════════════════════
app.set('trust proxy', 1);
app.disable('x-powered-by');

logger.info('🚀 Iniciando RapidFlow v3.0 Backend...', {
    nodeVersion: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development'
});

// ═══════════════════════════════════════════════════════════
// 2. VALIDAÇÕES DE AMBIENTE
// ═══════════════════════════════════════════════════════════
const requiredVars = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
    logger.critical('Variáveis de ambiente faltando', {
        missing: missing,
        message: 'Configure no arquivo .env ou nas variáveis de ambiente do Render'
    });
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 20) {
    logger.critical('JWT_SECRET muito curto - mínimo 20 caracteres', {
        currentLength: process.env.JWT_SECRET.length
    });
    process.exit(1);
}

logger.success('Variáveis de ambiente validadas', {
    requiredVars: requiredVars.length
});

// ═══════════════════════════════════════════════════════════
// 3. CORS - CONFIGURAÇÃO ROBUSTA
// ═══════════════════════════════════════════════════════════
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:3000'];

logger.info('CORS configurado', {
    origins: allowedOrigins,
    count: allowedOrigins.length
});

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

        logger.warn('CORS bloqueou requisição', { origin });
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

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE DE LOGS CUSTOMIZADO
// ═══════════════════════════════════════════════════════════
app.use(requestLoggerMiddleware);

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
    logger.info('Rotas carregadas com sucesso', {
        routes: ['auth', 'config', 'campaigns']
    });
} catch (error) {
    logger.critical('Erro fatal ao carregar rotas', {
        error: error.message,
        stack: error.stack
    });
    process.exit(1);
}

app.use('/api/auth', authRoutes);
app.use('/api/config', configRoutes);
app.use('/api/campaigns', campaignRoutes);

// ═══════════════════════════════════════════════════════════
// 7. ERROR HANDLERS - SISTEMA ROBUSTO v3.0
// ═══════════════════════════════════════════════════════════

// 404 Handler (deve vir ANTES do error handler)
app.use(notFoundHandler);

// Error Handler principal
app.use(errorHandlerMiddleware);

// ═══════════════════════════════════════════════════════════
// 8. INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════
async function startServer() {
    try {
        // Importar database apenas quando necessário
        const { pool } = require('./config/database');
        const { runMigrations } = require('./auto-migration');

        logger.info('Conectando ao banco de dados...', {
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            ssl: process.env.DB_SSL === 'true'
        });

        await pool.query('SELECT NOW()');
        logger.success('PostgreSQL conectado com sucesso');

        logger.info('Executando migrations do banco de dados...');
        await runMigrations();
        logger.success('Banco de dados configurado e atualizado');

        app.listen(PORT, '0.0.0.0', () => {
            console.log('\n╔════════════════════════════════════════╗');
            console.log('║   ✅ RAPIDFLOW v3.0 ONLINE!          ║');
            console.log('╚════════════════════════════════════════╝');

            logger.info('Servidor iniciado com sucesso', {
                url: `http://0.0.0.0:${PORT}`,
                environment: process.env.NODE_ENV || 'development',
                cors: allowedOrigins,
                version: '3.0.0',
                features: {
                    logging: true,
                    errorHandling: true,
                    authentication: true,
                    rateLimit: true,
                    analytics: process.env.ENABLE_ANALYTICS !== 'false'
                }
            });

            console.log(`🌐 URL: http://0.0.0.0:${PORT}`);
            console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔒 CORS: ${allowedOrigins.join(', ')}`);
            console.log(`📝 Logs: Habilitados`);
            console.log('');
        });

    } catch (error) {
        logger.critical('Erro fatal ao iniciar servidor', {
            error: error.message,
            stack: error.stack,
            code: error.code
        });
        process.exit(1);
    }
}

// ═══════════════════════════════════════════════════════════
// 9. HANDLERS DE ERROS GLOBAIS - SISTEMA ROBUSTO v3.0
// ═══════════════════════════════════════════════════════════
registerGlobalHandlers();

// INICIAR SERVIDOR
startServer();