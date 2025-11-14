// =====================================================
// WEBSOCKET SERVICE - Notificações em Tempo Real
// =====================================================

const WebSocket = require('ws');
const { EventEmitter } = require('events');

class WebSocketService extends EventEmitter {
    constructor() {
        super();
        this.wss = null;
        this.clients = new Map(); // userId -> Set of WebSocket connections
        this.campaignClients = new Map(); // campaignId -> Set of WebSocket connections
    }

    /**
     * Inicializa o servidor WebSocket
     */
    initialize(server) {
        this.wss = new WebSocket.Server({
            server,
            path: '/ws',
            verifyClient: (info) => {
                // Aqui você pode adicionar autenticação
                return true;
            }
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Novo cliente WebSocket conectado');

            ws.isAlive = true;
            ws.on('pong', () => { ws.isAlive = true; });

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(ws, data);
                } catch (error) {
                    console.error('Erro ao processar mensagem WS:', error);
                }
            });

            ws.on('close', () => {
                this.removeClient(ws);
                console.log('🔌 Cliente WebSocket desconectado');
            });

            ws.on('error', (error) => {
                console.error('Erro WebSocket:', error);
                this.removeClient(ws);
            });
        });

        // Heartbeat para manter conexões vivas
        this.startHeartbeat();

        console.log('✅ WebSocket Service inicializado');
    }

    /**
     * Processa mensagens dos clientes
     */
    handleClientMessage(ws, data) {
        const { type, userId, campaignId } = data;

        switch (type) {
            case 'subscribe_user':
                this.subscribeUser(ws, userId);
                break;
            case 'subscribe_campaign':
                this.subscribeCampaign(ws, campaignId);
                break;
            case 'unsubscribe_campaign':
                this.unsubscribeCampaign(ws, campaignId);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }

    /**
     * Inscreve cliente para receber atualizações de um usuário
     */
    subscribeUser(ws, userId) {
        if (!this.clients.has(userId)) {
            this.clients.set(userId, new Set());
        }
        this.clients.get(userId).add(ws);
        ws.userId = userId;

        ws.send(JSON.stringify({
            type: 'subscribed',
            userId: userId,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Inscreve cliente para receber atualizações de uma campanha
     */
    subscribeCampaign(ws, campaignId) {
        if (!this.campaignClients.has(campaignId)) {
            this.campaignClients.set(campaignId, new Set());
        }
        this.campaignClients.get(campaignId).add(ws);
        ws.campaignId = campaignId;

        ws.send(JSON.stringify({
            type: 'subscribed_campaign',
            campaignId: campaignId,
            timestamp: new Date().toISOString()
        }));
    }

    /**
     * Cancela inscrição de campanha
     */
    unsubscribeCampaign(ws, campaignId) {
        if (this.campaignClients.has(campaignId)) {
            this.campaignClients.get(campaignId).delete(ws);
            if (this.campaignClients.get(campaignId).size === 0) {
                this.campaignClients.delete(campaignId);
            }
        }
    }

    /**
     * Remove cliente de todas as inscrições
     */
    removeClient(ws) {
        if (ws.userId) {
            const userClients = this.clients.get(ws.userId);
            if (userClients) {
                userClients.delete(ws);
                if (userClients.size === 0) {
                    this.clients.delete(ws.userId);
                }
            }
        }

        if (ws.campaignId) {
            const campaignClients = this.campaignClients.get(ws.campaignId);
            if (campaignClients) {
                campaignClients.delete(ws);
                if (campaignClients.size === 0) {
                    this.campaignClients.delete(ws.campaignId);
                }
            }
        }
    }

    /**
     * Envia atualização de campanha para todos os clientes inscritos
     */
    notifyCampaignUpdate(campaignId, userId, data) {
        const message = JSON.stringify({
            type: 'campaign_update',
            campaignId,
            data,
            timestamp: new Date().toISOString()
        });

        // Notificar clientes inscritos na campanha
        if (this.campaignClients.has(campaignId)) {
            this.campaignClients.get(campaignId).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }

        // Notificar clientes inscritos no usuário
        if (this.clients.has(userId)) {
            this.clients.get(userId).forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    }

    /**
     * Notifica sobre mensagem enviada
     */
    notifyMessageSent(campaignId, userId, messageData) {
        this.notifyCampaignUpdate(campaignId, userId, {
            event: 'message_sent',
            ...messageData
        });
    }

    /**
     * Notifica sobre erro de mensagem
     */
    notifyMessageError(campaignId, userId, errorData) {
        this.notifyCampaignUpdate(campaignId, userId, {
            event: 'message_error',
            ...errorData
        });
    }

    /**
     * Notifica sobre progresso da campanha
     */
    notifyProgress(campaignId, userId, progressData) {
        this.notifyCampaignUpdate(campaignId, userId, {
            event: 'progress',
            ...progressData
        });
    }

    /**
     * Notifica sobre conclusão da campanha
     */
    notifyCampaignComplete(campaignId, userId, summaryData) {
        this.notifyCampaignUpdate(campaignId, userId, {
            event: 'campaign_complete',
            ...summaryData
        });
    }

    /**
     * Heartbeat para manter conexões vivas
     */
    startHeartbeat() {
        setInterval(() => {
            if (!this.wss) return;

            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    this.removeClient(ws);
                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 segundos
    }

    /**
     * Broadcast para todos os clientes
     */
    broadcast(data) {
        const message = JSON.stringify(data);
        if (!this.wss) return;

        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    /**
     * Retorna estatísticas do serviço
     */
    getStats() {
        return {
            totalConnections: this.wss ? this.wss.clients.size : 0,
            subscribedUsers: this.clients.size,
            subscribedCampaigns: this.campaignClients.size
        };
    }
}

module.exports = new WebSocketService();
