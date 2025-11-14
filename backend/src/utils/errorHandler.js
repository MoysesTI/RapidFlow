/**
 * ═══════════════════════════════════════════════════════════
 * RAPIDFLOW v3.0 - SISTEMA DE TRATAMENTO DE ERROS
 * ═══════════════════════════════════════════════════════════
 * Error handling robusto com:
 * - Classificação de erros
 * - Respostas padronizadas
 * - Logging automático
 * - Rastreamento de stack
 * - Notificações de erros críticos
 * ═══════════════════════════════════════════════════════════
 */

const { logger } = require('./logger');

// ═══════════════════════════════════════════════════════════
// CLASSES DE ERRO CUSTOMIZADAS
// ═══════════════════════════════════════════════════════════

/**
 * Erro base customizado
 */
class AppError extends Error {
    constructor(message, statusCode = 500, type = 'INTERNAL_ERROR', details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.type = type;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            error: true,
            type: this.type,
            message: this.message,
            statusCode: this.statusCode,
            details: this.details,
            ...(process.env.NODE_ENV !== 'production' && { stack: this.stack })
        };
    }
}

/**
 * Erro de validação (400)
 */
class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, 400, 'VALIDATION_ERROR', details);
    }
}

/**
 * Erro de autenticação (401)
 */
class AuthenticationError extends AppError {
    constructor(message = 'Não autenticado', details = {}) {
        super(message, 401, 'AUTHENTICATION_ERROR', details);
    }
}

/**
 * Erro de autorização (403)
 */
class AuthorizationError extends AppError {
    constructor(message = 'Acesso negado', details = {}) {
        super(message, 403, 'AUTHORIZATION_ERROR', details);
    }
}

/**
 * Erro de não encontrado (404)
 */
class NotFoundError extends AppError {
    constructor(resource = 'Recurso', details = {}) {
        super(`${resource} não encontrado`, 404, 'NOT_FOUND', details);
    }
}

/**
 * Erro de conflito (409)
 */
class ConflictError extends AppError {
    constructor(message = 'Recurso já existe', details = {}) {
        super(message, 409, 'CONFLICT_ERROR', details);
    }
}

/**
 * Erro de rate limit (429)
 */
class RateLimitError extends AppError {
    constructor(message = 'Muitas requisições', details = {}) {
        super(message, 429, 'RATE_LIMIT_ERROR', details);
    }
}

/**
 * Erro de banco de dados (500)
 */
class DatabaseError extends AppError {
    constructor(message = 'Erro no banco de dados', details = {}) {
        super(message, 500, 'DATABASE_ERROR', details);
    }
}

/**
 * Erro de integração externa (502)
 */
class ExternalServiceError extends AppError {
    constructor(service = 'Serviço externo', message = 'Erro na integração', details = {}) {
        super(`${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', { service, ...details });
    }
}

/**
 * Erro de webhook (503)
 */
class WebhookError extends AppError {
    constructor(message = 'Erro ao processar webhook', details = {}) {
        super(message, 503, 'WEBHOOK_ERROR', details);
    }
}

// ═══════════════════════════════════════════════════════════
// FUNÇÕES AUXILIARES
// ═══════════════════════════════════════════════════════════

/**
 * Detectar tipo de erro e converter para AppError
 */
function normalizeError(error) {
    // Já é um erro customizado
    if (error instanceof AppError) {
        return error;
    }

    // Erro de validação do Express Validator
    if (error.array && typeof error.array === 'function') {
        return new ValidationError('Dados inválidos', { errors: error.array() });
    }

    // Erro do PostgreSQL
    if (error.code && error.code.startsWith('23')) {
        if (error.code === '23505') {
            return new ConflictError('Registro duplicado', {
                constraint: error.constraint,
                detail: error.detail
            });
        }
        if (error.code === '23503') {
            return new ValidationError('Referência inválida', {
                constraint: error.constraint,
                detail: error.detail
            });
        }
        return new DatabaseError('Erro de integridade no banco', {
            code: error.code,
            detail: error.detail
        });
    }

    // Erro de conexão com o banco
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        return new DatabaseError('Não foi possível conectar ao banco de dados', {
            code: error.code
        });
    }

    // Erro de JWT
    if (error.name === 'JsonWebTokenError') {
        return new AuthenticationError('Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
        return new AuthenticationError('Token expirado');
    }

    // Erro de timeout
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return new ExternalServiceError('Timeout', 'Tempo de resposta excedido', {
            timeout: true
        });
    }

    // Erro genérico
    return new AppError(
        error.message || 'Erro interno do servidor',
        error.statusCode || 500,
        'INTERNAL_ERROR',
        {
            originalError: error.name,
            ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
        }
    );
}

/**
 * Determinar se erro é operacional ou de programação
 */
function isOperationalError(error) {
    if (error instanceof AppError) {
        return error.isOperational;
    }
    return false;
}

/**
 * Formatar erro para resposta HTTP
 */
function formatErrorResponse(error) {
    const normalizedError = normalizeError(error);

    return {
        error: true,
        type: normalizedError.type,
        message: normalizedError.message,
        ...(normalizedError.statusCode >= 400 && normalizedError.statusCode < 500 && {
            details: normalizedError.details
        }),
        ...(process.env.NODE_ENV !== 'production' && {
            stack: normalizedError.stack,
            originalError: error.message
        })
    };
}

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE DE ERROR HANDLING
// ═══════════════════════════════════════════════════════════

/**
 * Middleware principal de tratamento de erros
 */
function errorHandlerMiddleware(err, req, res, next) {
    // Normalizar erro
    const normalizedError = normalizeError(err);
    const statusCode = normalizedError.statusCode || 500;

    // Determinar nível de log
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    // Logar erro
    const logDetails = {
        error: normalizedError,
        type: normalizedError.type,
        statusCode: statusCode,
        path: req.originalUrl,
        method: req.method,
        userId: req.user?.userId,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        body: req.body,
        params: req.params,
        query: req.query,
        stack: normalizedError.stack
    };

    // Log usando o logger
    const reqLogger = req.logger || logger;
    reqLogger._log(logLevel, 'api', normalizedError.message, logDetails, req);

    // Garantir CORS nos headers de erro
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Enviar resposta
    res.status(statusCode).json(formatErrorResponse(normalizedError));
}

/**
 * Middleware para catch de rotas não encontradas
 */
function notFoundHandler(req, res, next) {
    const error = new NotFoundError('Rota', {
        path: req.originalUrl,
        method: req.method
    });
    next(error);
}

/**
 * Wrapper para funções async (evita try-catch manual)
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

/**
 * Wrapper para validação de dados
 */
function validateRequest(schema) {
    return (req, res, next) => {
        try {
            // Validar usando Joi, Yup, ou similar
            // Por enquanto, apenas passar adiante
            next();
        } catch (error) {
            next(new ValidationError('Dados inválidos', { errors: error.details }));
        }
    };
}

// ═══════════════════════════════════════════════════════════
// HANDLERS DE ERROS GLOBAIS
// ═══════════════════════════════════════════════════════════

/**
 * Handler para uncaught exceptions
 */
function uncaughtExceptionHandler(error) {
    logger.critical('💥 Uncaught Exception - Aplicação será encerrada', {
        error: error.message,
        stack: error.stack,
        type: error.name
    });

    // Dar tempo para salvar logs
    setTimeout(() => {
        process.exit(1);
    }, 1000);
}

/**
 * Handler para unhandled rejections
 */
function unhandledRejectionHandler(reason, promise) {
    logger.critical('💥 Unhandled Promise Rejection - Aplicação será encerrada', {
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise
    });

    // Dar tempo para salvar logs
    setTimeout(() => {
        process.exit(1);
    }, 1000);
}

/**
 * Handler para SIGTERM
 */
function sigtermHandler() {
    logger.info('👋 SIGTERM recebido - Encerrando aplicação graciosamente');
    process.exit(0);
}

/**
 * Registrar handlers globais
 */
function registerGlobalHandlers() {
    process.on('uncaughtException', uncaughtExceptionHandler);
    process.on('unhandledRejection', unhandledRejectionHandler);
    process.on('SIGTERM', sigtermHandler);
    process.on('SIGINT', sigtermHandler);
}

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
    // Classes de erro
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    RateLimitError,
    DatabaseError,
    ExternalServiceError,
    WebhookError,

    // Funções auxiliares
    normalizeError,
    isOperationalError,
    formatErrorResponse,

    // Middlewares
    errorHandlerMiddleware,
    notFoundHandler,
    asyncHandler,
    validateRequest,

    // Global handlers
    registerGlobalHandlers,
    uncaughtExceptionHandler,
    unhandledRejectionHandler,
    sigtermHandler,
};
