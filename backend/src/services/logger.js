// =====================================================
// LOGGER SERVICE - Logging Estruturado
// =====================================================

const fs = require('fs');
const path = require('path');

class LoggerService {
    constructor() {
        this.logDir = path.join(__dirname, '../../logs');
        this.ensureLogDirectory();

        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };

        this.currentLevel = process.env.LOG_LEVEL || 'INFO';
    }

    ensureLogDirectory() {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    formatLog(level, message, meta = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            ...meta,
            pid: process.pid,
            hostname: require('os').hostname()
        };
    }

    shouldLog(level) {
        return this.levels[level] <= this.levels[this.currentLevel];
    }

    writeToFile(level, logData) {
        const date = new Date().toISOString().split('T')[0];
        const filename = `${date}-${level.toLowerCase()}.log`;
        const filepath = path.join(this.logDir, filename);

        const logLine = JSON.stringify(logData) + '\n';

        fs.appendFile(filepath, logLine, (err) => {
            if (err) console.error('Erro ao escrever log:', err);
        });
    }

    log(level, message, meta = {}) {
        if (!this.shouldLog(level)) return;

        const logData = this.formatLog(level, message, meta);

        // Console output com cores
        const colors = {
            ERROR: '\x1b[31m', // Vermelho
            WARN: '\x1b[33m',  // Amarelo
            INFO: '\x1b[36m',  // Ciano
            DEBUG: '\x1b[90m'  // Cinza
        };

        const color = colors[level] || '';
        const reset = '\x1b[0m';

        console.log(`${color}[${logData.timestamp}] ${level}:${reset} ${message}`,
                    meta && Object.keys(meta).length > 0 ? meta : '');

        // Escrever em arquivo
        this.writeToFile(level, logData);
    }

    error(message, meta = {}) {
        this.log('ERROR', message, meta);
    }

    warn(message, meta = {}) {
        this.log('WARN', message, meta);
    }

    info(message, meta = {}) {
        this.log('INFO', message, meta);
    }

    debug(message, meta = {}) {
        this.log('DEBUG', message, meta);
    }

    // Logging específico de campanha
    campaignLog(campaignId, event, data = {}) {
        this.info(`Campaign Event: ${event}`, {
            campaignId,
            event,
            ...data
        });
    }

    // Logging de performance
    performance(operation, duration, meta = {}) {
        this.info(`Performance: ${operation}`, {
            operation,
            duration_ms: duration,
            ...meta
        });
    }

    // Logging de API requests
    apiRequest(req, res, duration) {
        this.info('API Request', {
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration_ms: duration,
            ip: req.ip,
            user: req.user?.userId
        });
    }

    // Capturar erros não tratados
    setupErrorHandlers() {
        process.on('uncaughtException', (error) => {
            this.error('Uncaught Exception', {
                error: error.message,
                stack: error.stack
            });
        });

        process.on('unhandledRejection', (reason, promise) => {
            this.error('Unhandled Rejection', {
                reason: reason,
                promise: promise
            });
        });
    }
}

module.exports = new LoggerService();
