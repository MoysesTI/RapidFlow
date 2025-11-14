// =====================================================
// RATE LIMITER SERVICE - Controle de Taxa Inteligente
// =====================================================

class RateLimiterService {
    constructor() {
        // Armazenar contadores em memória (pode ser migrado para Redis)
        this.counters = new Map();
        this.windows = new Map();

        // Configurações padrão
        this.config = {
            maxRequestsPerMinute: 60,
            maxConcurrentCampaigns: 5,
            maxMessagesPerSecond: 2,
            burstLimit: 10
        };

        // Limpar contadores antigos a cada minuto
        setInterval(() => this.cleanup(), 60000);
    }

    /**
     * Verifica se o usuário pode criar uma nova campanha
     */
    async canCreateCampaign(userId) {
        const key = `campaign:${userId}`;
        const now = Date.now();
        const windowTime = 60000; // 1 minuto

        if (!this.windows.has(key)) {
            this.windows.set(key, []);
        }

        const window = this.windows.get(key);

        // Remover timestamps antigos
        const validTimestamps = window.filter(ts => now - ts < windowTime);
        this.windows.set(key, validTimestamps);

        // Verificar limite
        if (validTimestamps.length >= this.config.maxRequestsPerMinute) {
            const oldestTimestamp = validTimestamps[0];
            const resetIn = windowTime - (now - oldestTimestamp);

            return {
                allowed: false,
                resetIn: Math.ceil(resetIn / 1000),
                message: `Limite excedido. Aguarde ${Math.ceil(resetIn / 1000)}s`
            };
        }

        // Adicionar novo timestamp
        validTimestamps.push(now);
        this.windows.set(key, validTimestamps);

        return {
            allowed: true,
            remaining: this.config.maxRequestsPerMinute - validTimestamps.length
        };
    }

    /**
     * Controle de burst (rajada de mensagens)
     */
    async checkBurstLimit(campaignId) {
        const key = `burst:${campaignId}`;
        const now = Date.now();
        const windowTime = 1000; // 1 segundo

        if (!this.windows.has(key)) {
            this.windows.set(key, []);
        }

        const window = this.windows.get(key);
        const validTimestamps = window.filter(ts => now - ts < windowTime);

        if (validTimestamps.length >= this.config.burstLimit) {
            return {
                allowed: false,
                message: 'Burst limit excedido',
                retryAfter: 1
            };
        }

        validTimestamps.push(now);
        this.windows.set(key, validTimestamps);

        return {
            allowed: true,
            remaining: this.config.burstLimit - validTimestamps.length
        };
    }

    /**
     * Rate limiting por segundo (para mensagens)
     */
    async checkMessageRate(campaignId) {
        const key = `message:${campaignId}`;
        const now = Date.now();
        const windowTime = 1000; // 1 segundo

        if (!this.windows.has(key)) {
            this.windows.set(key, []);
        }

        const window = this.windows.get(key);
        const validTimestamps = window.filter(ts => now - ts < windowTime);

        if (validTimestamps.length >= this.config.maxMessagesPerSecond) {
            const oldestTimestamp = validTimestamps[0];
            const resetIn = windowTime - (now - oldestTimestamp);

            return {
                allowed: false,
                resetIn: Math.ceil(resetIn),
                message: `Rate limit excedido para mensagens`
            };
        }

        validTimestamps.push(now);
        this.windows.set(key, validTimestamps);

        return {
            allowed: true,
            remaining: this.config.maxMessagesPerSecond - validTimestamps.length
        };
    }

    /**
     * Calcula delay recomendado baseado em carga
     */
    calculateRecommendedDelay(campaignId) {
        const key = `message:${campaignId}`;
        const window = this.windows.get(key) || [];

        // Se estiver próximo do limite, aumentar delay
        const usage = window.length / this.config.maxMessagesPerSecond;

        if (usage > 0.8) {
            return 1000; // 1 segundo
        } else if (usage > 0.5) {
            return 500; // 500ms
        }

        return 200; // 200ms padrão
    }

    /**
     * Limpa contadores antigos
     */
    cleanup() {
        const now = Date.now();
        const maxAge = 300000; // 5 minutos

        for (const [key, timestamps] of this.windows.entries()) {
            const validTimestamps = timestamps.filter(ts => now - ts < maxAge);

            if (validTimestamps.length === 0) {
                this.windows.delete(key);
            } else {
                this.windows.set(key, validTimestamps);
            }
        }
    }

    /**
     * Estatísticas do rate limiter
     */
    getStats() {
        return {
            activeWindows: this.windows.size,
            config: this.config
        };
    }

    /**
     * Atualiza configurações
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

module.exports = new RateLimiterService();
