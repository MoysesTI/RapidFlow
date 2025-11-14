// =====================================================
// VALIDATION MIDDLEWARE - Validação Robusta de Dados
// =====================================================

const logger = require('../services/logger');

/**
 * Valida payload de campanha
 */
function validateCampaignPayload(req, res, next) {
    const { name, contacts, config } = req.body;

    const errors = [];

    // Validar nome
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
        errors.push('Nome da campanha é obrigatório');
    } else if (name.length > 255) {
        errors.push('Nome da campanha não pode ter mais de 255 caracteres');
    }

    // Validar contatos
    if (!contacts || !Array.isArray(contacts)) {
        errors.push('Lista de contatos inválida');
    } else if (contacts.length === 0) {
        errors.push('A campanha deve ter pelo menos um contato');
    } else if (contacts.length > 10000) {
        errors.push('Máximo de 10.000 contatos por campanha');
    } else {
        // Validar cada contato
        contacts.forEach((contact, index) => {
            if (!contact.nome || typeof contact.nome !== 'string') {
                errors.push(`Contato ${index + 1}: nome inválido`);
            }
            if (!contact.telefone || typeof contact.telefone !== 'string') {
                errors.push(`Contato ${index + 1}: telefone inválido`);
            } else {
                // Validar formato do telefone
                const phoneDigits = contact.telefone.replace(/\D/g, '');
                if (phoneDigits.length < 10 || phoneDigits.length > 15) {
                    errors.push(`Contato ${index + 1}: telefone com formato inválido`);
                }
            }
        });
    }

    // Validar config (opcional, mas se fornecido deve ser válido)
    if (config) {
        if (typeof config !== 'object') {
            errors.push('Configuração inválida');
        } else {
            // Validar URLs se fornecidas
            if (config.imageUrl && !isValidUrl(config.imageUrl)) {
                errors.push('URL da imagem inválida');
            }

            if (config.webhookUrl && !isValidUrl(config.webhookUrl)) {
                errors.push('URL do webhook inválida');
            }

            // Validar delays
            if (config.delayMin !== undefined) {
                const delay = parseInt(config.delayMin);
                if (isNaN(delay) || delay < 0 || delay > 3600) {
                    errors.push('Delay mínimo inválido (0-3600 segundos)');
                }
            }

            if (config.delayMax !== undefined) {
                const delay = parseInt(config.delayMax);
                if (isNaN(delay) || delay < 0 || delay > 3600) {
                    errors.push('Delay máximo inválido (0-3600 segundos)');
                }
            }

            if (config.delayMin && config.delayMax && config.delayMin > config.delayMax) {
                errors.push('Delay mínimo não pode ser maior que o máximo');
            }

            // Validar modelo OpenAI
            const validModels = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo', 'gpt-4.1-mini'];
            if (config.openaiModel && !validModels.includes(config.openaiModel)) {
                errors.push(`Modelo OpenAI inválido. Use: ${validModels.join(', ')}`);
            }
        }
    }

    if (errors.length > 0) {
        logger.warn('Validação de campanha falhou', {
            errors,
            userId: req.user?.userId
        });

        return res.status(400).json({
            success: false,
            message: 'Validação falhou',
            errors: errors
        });
    }

    next();
}

/**
 * Valida callback do n8n
 */
function validateN8nCallback(req, res, next) {
    const { contactName, phone, status } = req.body;
    const errors = [];

    if (!contactName || typeof contactName !== 'string') {
        errors.push('Nome do contato é obrigatório');
    }

    if (!phone || typeof phone !== 'string') {
        errors.push('Telefone é obrigatório');
    }

    if (!status || !['sent', 'error', 'pending'].includes(status)) {
        errors.push('Status inválido (sent, error, pending)');
    }

    if (status === 'error' && !req.body.errorMessage) {
        errors.push('Mensagem de erro é obrigatória quando status=error');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validação do callback falhou',
            errors: errors
        });
    }

    next();
}

/**
 * Valida progresso da campanha
 */
function validateProgressUpdate(req, res, next) {
    const { currentPosition, sent, errors } = req.body;
    const validationErrors = [];

    if (currentPosition === undefined || typeof currentPosition !== 'number' || currentPosition < 0) {
        validationErrors.push('currentPosition deve ser um número não-negativo');
    }

    if (sent === undefined || typeof sent !== 'number' || sent < 0) {
        validationErrors.push('sent deve ser um número não-negativo');
    }

    if (errors !== undefined && (typeof errors !== 'number' || errors < 0)) {
        validationErrors.push('errors deve ser um número não-negativo');
    }

    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validação do progresso falhou',
            errors: validationErrors
        });
    }

    next();
}

/**
 * Sanitiza entrada de texto
 */
function sanitizeText(text) {
    if (typeof text !== 'string') return '';

    return text
        .trim()
        .replace(/[<>]/g, '') // Remove < e >
        .substring(0, 1000); // Limita tamanho
}

/**
 * Valida URL
 */
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Valida telefone brasileiro
 */
function validateBrazilianPhone(phone) {
    const digits = phone.replace(/\D/g, '');

    // Aceitar formatos:
    // 11 dígitos: DDD + 9 dígitos
    // 10 dígitos: DDD + 8 dígitos
    // 13 dígitos: +55 DDD + 9 dígitos

    if (digits.length === 11 || digits.length === 10) {
        return true;
    }

    if (digits.length === 13 && digits.startsWith('55')) {
        return true;
    }

    return false;
}

/**
 * Normaliza telefone
 */
function normalizePhone(phone) {
    let digits = phone.replace(/\D/g, '');

    // Adicionar código do país se necessário
    if (digits.length <= 11) {
        digits = '55' + digits;
    }

    return digits;
}

module.exports = {
    validateCampaignPayload,
    validateN8nCallback,
    validateProgressUpdate,
    sanitizeText,
    isValidUrl,
    validateBrazilianPhone,
    normalizePhone
};
