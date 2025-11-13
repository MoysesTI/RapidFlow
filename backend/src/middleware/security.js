const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Rate limiting por IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 tentativas
    message: { 
        error: true, 
        message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' 
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { 
        error: true, 
        message: 'Muitas requisições. Tente novamente em alguns minutos.' 
    },
});

// Upload limiter
const uploadLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 uploads por minuto
    message: { 
        error: true, 
        message: 'Muitos uploads. Aguarde um minuto.' 
    },
});

// Configuração de segurança do Helmet
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
});

// Validação de entrada
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input
        .replace(/[<>]/g, '') // Remove < e >
        .trim()
        .slice(0, 1000); // Limita tamanho
}

// Validar JWT Secret
function validateJWTSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.length < 32) {
        console.error('❌ ERRO CRÍTICO: JWT_SECRET deve ter no mínimo 32 caracteres!');
        process.exit(1);
    }
}

// Validar variáveis obrigatórias
function validateEnvVariables() {
    const required = [
        'DB_HOST',
        'DB_NAME', 
        'DB_USER',
        'DB_PASSWORD',
        'JWT_SECRET'
    ];
    
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        console.error('❌ ERRO: Variáveis de ambiente faltando:', missing.join(', '));
        console.error('📝 Configure no arquivo .env ou no painel do Render');
        process.exit(1);
    }
}

module.exports = {
    loginLimiter,
    apiLimiter,
    uploadLimiter,
    helmetConfig,
    sanitizeInput,
    validateJWTSecret,
    validateEnvVariables
};