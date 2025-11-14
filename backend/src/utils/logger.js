/**
 * ═══════════════════════════════════════════════════════════
 * RAPIDFLOW v3.0 - SISTEMA DE LOGS CENTRALIZADO
 * ═══════════════════════════════════════════════════════════
 * Logger robusto com suporte a:
 * - Múltiplos níveis (debug, info, warn, error, critical)
 * - Persistência em banco de dados
 * - Formatação colorida para console
 * - Contexto de usuário e campanha
 * - Stack traces automáticos
 * ═══════════════════════════════════════════════════════════
 */

const { pool } = require('../config/database');

// Cores para console (ANSI)
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',

    // Níveis
    debug: '\x1b[36m',    // Cyan
    info: '\x1b[32m',     // Green
    warn: '\x1b[33m',     // Yellow
    error: '\x1b[31m',    // Red
    critical: '\x1b[35m', // Magenta

    // Tipos
    api: '\x1b[34m',      // Blue
    webhook: '\x1b[36m',  // Cyan
    n8n: '\x1b[95m',      // Light Magenta
    auth: '\x1b[33m',     // Yellow
    campaign: '\x1b[32m', // Green
    system: '\x1b[37m',   // White
};

// Emojis para cada nível
const emojis = {
    debug: '🔍',
    info: '✅',
    warn: '⚠️',
    error: '❌',
    critical: '💥',
};

// Emojis para cada tipo
const typeEmojis = {
    api: '🌐',
    webhook: '🔗',
    n8n: '⚙️',
    auth: '🔐',
    campaign: '📨',
    system: '⚡',
};

class Logger {
    /**
     * Construtor do Logger
     * @param {Object} context - Contexto padrão (userId, campaignId, etc)
     */
    constructor(context = {}) {
        this.context = context;
    }

    /**
     * Log interno - não usar diretamente
     */
    async _log(level, type, message, details = {}, req = null) {
        const timestamp = new Date().toISOString();
        const color = colors[level] || colors.reset;
        const emoji = emojis[level] || '📝';
        const typeEmoji = typeEmojis[type] || '📝';

        // Console formatado
        const consoleMessage = `${color}${emoji} [${level.toUpperCase()}]${colors.reset} ${typeEmoji} ${colors[type] || ''}[${type.toUpperCase()}]${colors.reset} ${message}`;
        console.log(consoleMessage);

        // Se tiver detalhes, mostrar no console também
        if (Object.keys(details).length > 0 && process.env.NODE_ENV !== 'production') {
            console.log(`${colors.dim}   Details:${colors.reset}`, details);
        }

        // Salvar no banco de dados (async, não bloquear)
        this._saveToDatabase(level, type, message, details, req).catch(err => {
            console.error('⚠️  Erro ao salvar log no banco:', err.message);
        });
    }

    /**
     * Salvar log no banco de dados
     */
    async _saveToDatabase(level, type, message, details, req) {
        try {
            // Extrair informações do request HTTP
            let httpMethod = null;
            let httpPath = null;
            let httpStatus = null;
            let httpIp = null;
            let httpUserAgent = null;

            if (req) {
                httpMethod = req.method;
                httpPath = req.originalUrl || req.url;
                httpStatus = req.statusCode || details.statusCode;
                httpIp = req.ip || req.connection.remoteAddress;
                httpUserAgent = req.get('user-agent');
            }

            // Stack trace para erros
            let stackTrace = null;
            if (level === 'error' || level === 'critical') {
                if (details.error instanceof Error) {
                    stackTrace = details.error.stack;
                } else if (details.stack) {
                    stackTrace = details.stack;
                }
            }

            await pool.query(`
                INSERT INTO system_logs (
                    user_id,
                    campaign_id,
                    log_level,
                    log_type,
                    message,
                    details,
                    stack_trace,
                    http_method,
                    http_path,
                    http_status,
                    http_ip,
                    http_user_agent,
                    duration_ms,
                    metadata
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            `, [
                this.context.userId || null,
                this.context.campaignId || null,
                level,
                type,
                message,
                JSON.stringify(details),
                stackTrace,
                httpMethod,
                httpPath,
                httpStatus,
                httpIp,
                httpUserAgent,
                details.duration || null,
                JSON.stringify(this.context)
            ]);
        } catch (error) {
            // Falha silenciosa - não queremos quebrar a aplicação por falha no log
            console.error('❌ Database log error:', error.message);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTODOS PÚBLICOS - NÍVEIS DE LOG
    // ═══════════════════════════════════════════════════════════

    /**
     * Log de debug (desenvolvimento)
     */
    debug(message, details = {}, req = null) {
        if (process.env.NODE_ENV === 'production') return;
        return this._log('debug', this.context.type || 'system', message, details, req);
    }

    /**
     * Log de informação (eventos normais)
     */
    info(message, details = {}, req = null) {
        return this._log('info', this.context.type || 'system', message, details, req);
    }

    /**
     * Log de aviso (situações suspeitas)
     */
    warn(message, details = {}, req = null) {
        return this._log('warn', this.context.type || 'system', message, details, req);
    }

    /**
     * Log de erro (erros recuperáveis)
     */
    error(message, details = {}, req = null) {
        return this._log('error', this.context.type || 'system', message, details, req);
    }

    /**
     * Log crítico (erros graves)
     */
    critical(message, details = {}, req = null) {
        return this._log('critical', this.context.type || 'system', message, details, req);
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTODOS ESPECÍFICOS POR TIPO
    // ═══════════════════════════════════════════════════════════

    /**
     * Log de API
     */
    api(level, message, details = {}, req = null) {
        return this._log(level, 'api', message, details, req);
    }

    /**
     * Log de Webhook
     */
    webhook(level, message, details = {}, req = null) {
        return this._log(level, 'webhook', message, details, req);
    }

    /**
     * Log de N8N
     */
    n8n(level, message, details = {}, req = null) {
        return this._log(level, 'n8n', message, details, req);
    }

    /**
     * Log de Autenticação
     */
    auth(level, message, details = {}, req = null) {
        return this._log(level, 'auth', message, details, req);
    }

    /**
     * Log de Campanha
     */
    campaign(level, message, details = {}, req = null) {
        return this._log(level, 'campaign', message, details, req);
    }

    /**
     * Log de Sistema
     */
    system(level, message, details = {}, req = null) {
        return this._log(level, 'system', message, details, req);
    }

    // ═══════════════════════════════════════════════════════════
    // MÉTODOS AUXILIARES
    // ═══════════════════════════════════════════════════════════

    /**
     * Criar novo logger com contexto específico
     */
    withContext(context) {
        return new Logger({ ...this.context, ...context });
    }

    /**
     * Log de requisição HTTP completa
     */
    async logRequest(req, res, duration) {
        const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

        await this._log(level, 'api', `${req.method} ${req.originalUrl} - ${res.statusCode}`, {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            duration: duration,
            ip: req.ip,
            userAgent: req.get('user-agent'),
            userId: req.user?.userId,
        }, req);
    }

    /**
     * Log de performance (timing)
     */
    async performance(operation, durationMs, details = {}) {
        const level = durationMs > 5000 ? 'warn' : 'info';
        const message = `${operation} completado em ${durationMs}ms`;

        await this._log(level, 'system', message, {
            operation,
            duration: durationMs,
            ...details
        });
    }
}

// ═══════════════════════════════════════════════════════════
// MIDDLEWARE EXPRESS
// ═══════════════════════════════════════════════════════════

/**
 * Middleware para logar todas as requisições HTTP
 */
function requestLoggerMiddleware(req, res, next) {
    const startTime = Date.now();

    // Logger específico para esta request
    req.logger = new Logger({
        type: 'api',
        userId: req.user?.userId,
        ip: req.ip
    });

    // Interceptar o fim da response
    const originalEnd = res.end;
    res.end = function(...args) {
        const duration = Date.now() - startTime;

        // Log assíncrono
        req.logger.logRequest(req, res, duration).catch(err => {
            console.error('Error logging request:', err);
        });

        originalEnd.apply(res, args);
    };

    next();
}

// ═══════════════════════════════════════════════════════════
// INSTÂNCIA GLOBAL
// ═══════════════════════════════════════════════════════════

const globalLogger = new Logger({ type: 'system' });

// ═══════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════

module.exports = {
    Logger,
    requestLoggerMiddleware,
    logger: globalLogger,

    // Shortcuts
    debug: (...args) => globalLogger.debug(...args),
    info: (...args) => globalLogger.info(...args),
    warn: (...args) => globalLogger.warn(...args),
    error: (...args) => globalLogger.error(...args),
    critical: (...args) => globalLogger.critical(...args),
};
