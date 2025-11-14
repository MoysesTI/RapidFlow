// =====================================================
// ANALYTICS SERVICE - Métricas e Analytics de Campanhas
// =====================================================

const { pool } = require('../config/database');

class AnalyticsService {
    /**
     * Registra evento de campanha
     */
    async trackEvent(campaignId, eventType, eventData = {}) {
        try {
            await pool.query(
                `INSERT INTO campaign_events (campaign_id, event_type, event_data, created_at)
                 VALUES ($1, $2, $3, NOW())`,
                [campaignId, eventType, JSON.stringify(eventData)]
            );
        } catch (error) {
            console.error('Erro ao registrar evento:', error);
        }
    }

    /**
     * Calcula métricas em tempo real de uma campanha
     */
    async getCampaignMetrics(campaignId) {
        try {
            const result = await pool.query(
                `SELECT
                    c.id,
                    c.campaign_id,
                    c.name,
                    c.status,
                    c.total_contacts,
                    c.sent_count,
                    c.error_count,
                    c.current_position,
                    c.success_rate,
                    c.created_at,
                    c.started_at,
                    c.completed_at,
                    c.last_update,
                    -- Métricas calculadas
                    CASE
                        WHEN c.total_contacts > 0
                        THEN ROUND((c.sent_count::DECIMAL / c.total_contacts) * 100, 2)
                        ELSE 0
                    END as progress_percentage,
                    CASE
                        WHEN c.sent_count > 0
                        THEN ROUND((c.error_count::DECIMAL / (c.sent_count + c.error_count)) * 100, 2)
                        ELSE 0
                    END as error_rate,
                    -- Tempo estimado
                    CASE
                        WHEN c.status = 'running' AND c.current_position > 0 AND c.started_at IS NOT NULL
                        THEN EXTRACT(EPOCH FROM (NOW() - c.started_at)) / c.current_position * (c.total_contacts - c.current_position)
                        ELSE 0
                    END as estimated_seconds_remaining,
                    -- Velocidade de envio (msgs/min)
                    CASE
                        WHEN c.started_at IS NOT NULL AND c.sent_count > 0
                        THEN ROUND((c.sent_count::DECIMAL / GREATEST(EXTRACT(EPOCH FROM (NOW() - c.started_at)) / 60, 1)), 2)
                        ELSE 0
                    END as messages_per_minute
                FROM campaigns c
                WHERE c.campaign_id = $1 OR c.id = $1`,
                [campaignId]
            );

            if (result.rows.length === 0) {
                return null;
            }

            const campaign = result.rows[0];

            // Buscar últimas mensagens
            const recentMessages = await pool.query(
                `SELECT status, COUNT(*) as count
                 FROM campaign_message_logs
                 WHERE campaign_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'
                 GROUP BY status`,
                [campaign.id]
            );

            campaign.recent_activity = recentMessages.rows;

            return campaign;
        } catch (error) {
            console.error('Erro ao calcular métricas:', error);
            throw error;
        }
    }

    /**
     * Retorna dashboard de analytics do usuário
     */
    async getUserDashboard(userId) {
        try {
            const stats = await pool.query(
                `SELECT
                    COUNT(*) as total_campaigns,
                    COUNT(*) FILTER (WHERE status = 'completed') as completed_campaigns,
                    COUNT(*) FILTER (WHERE status = 'running') as running_campaigns,
                    COUNT(*) FILTER (WHERE status = 'pending') as pending_campaigns,
                    COUNT(*) FILTER (WHERE status = 'error') as failed_campaigns,
                    SUM(total_contacts) as total_contacts_processed,
                    SUM(sent_count) as total_messages_sent,
                    SUM(error_count) as total_errors,
                    ROUND(AVG(success_rate), 2) as avg_success_rate,
                    MAX(created_at) as last_campaign_date
                FROM campaigns
                WHERE user_id = $1`,
                [userId]
            );

            // Campanhas recentes
            const recentCampaigns = await pool.query(
                `SELECT
                    campaign_id,
                    name,
                    status,
                    total_contacts,
                    sent_count,
                    error_count,
                    success_rate,
                    created_at,
                    completed_at
                FROM campaigns
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10`,
                [userId]
            );

            // Performance por dia (últimos 30 dias)
            const dailyStats = await pool.query(
                `SELECT
                    DATE(created_at) as date,
                    COUNT(*) as campaigns_count,
                    SUM(total_contacts) as total_contacts,
                    SUM(sent_count) as total_sent,
                    SUM(error_count) as total_errors,
                    ROUND(AVG(success_rate), 2) as avg_success_rate
                FROM campaigns
                WHERE user_id = $1
                    AND created_at > NOW() - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) DESC`,
                [userId]
            );

            return {
                summary: stats.rows[0],
                recent_campaigns: recentCampaigns.rows,
                daily_performance: dailyStats.rows
            };
        } catch (error) {
            console.error('Erro ao gerar dashboard:', error);
            throw error;
        }
    }

    /**
     * Análise de performance de mensagens
     */
    async getMessagePerformance(campaignId) {
        try {
            const campaign = await pool.query(
                'SELECT id FROM campaigns WHERE campaign_id = $1 OR id = $1',
                [campaignId]
            );

            if (campaign.rows.length === 0) {
                return null;
            }

            const dbCampaignId = campaign.rows[0].id;

            // Análise por hora do dia
            const hourlyAnalysis = await pool.query(
                `SELECT
                    EXTRACT(HOUR FROM created_at) as hour,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE status = 'sent') as sent,
                    COUNT(*) FILTER (WHERE status = 'error') as errors,
                    ROUND(AVG(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) * 100, 2) as success_rate
                FROM campaign_message_logs
                WHERE campaign_id = $1
                GROUP BY EXTRACT(HOUR FROM created_at)
                ORDER BY hour`,
                [dbCampaignId]
            );

            // Top erros
            const topErrors = await pool.query(
                `SELECT
                    error_message,
                    COUNT(*) as count,
                    ROUND((COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM campaign_message_logs WHERE campaign_id = $1 AND status = 'error')) * 100, 2) as percentage
                FROM campaign_message_logs
                WHERE campaign_id = $1 AND status = 'error'
                GROUP BY error_message
                ORDER BY count DESC
                LIMIT 10`,
                [dbCampaignId]
            );

            // Tempo médio de envio
            const avgTimes = await pool.query(
                `SELECT
                    AVG(EXTRACT(EPOCH FROM (sent_at - created_at))) as avg_send_time_seconds,
                    MIN(EXTRACT(EPOCH FROM (sent_at - created_at))) as min_send_time_seconds,
                    MAX(EXTRACT(EPOCH FROM (sent_at - created_at))) as max_send_time_seconds
                FROM campaign_message_logs
                WHERE campaign_id = $1 AND status = 'sent' AND sent_at IS NOT NULL`,
                [dbCampaignId]
            );

            return {
                hourly_analysis: hourlyAnalysis.rows,
                top_errors: topErrors.rows,
                timing_stats: avgTimes.rows[0]
            };
        } catch (error) {
            console.error('Erro na análise de performance:', error);
            throw error;
        }
    }

    /**
     * Exportar relatório completo da campanha
     */
    async exportCampaignReport(campaignId) {
        try {
            const metrics = await this.getCampaignMetrics(campaignId);
            const performance = await this.getMessagePerformance(campaignId);

            // Buscar todos os logs
            const logs = await pool.query(
                `SELECT
                    cml.contact_name,
                    cml.phone,
                    cml.status,
                    cml.message_text,
                    cml.error_message,
                    cml.retry_count,
                    cml.sent_at,
                    cml.created_at
                FROM campaign_message_logs cml
                JOIN campaigns c ON c.id = cml.campaign_id
                WHERE c.campaign_id = $1 OR c.id = $1
                ORDER BY cml.created_at ASC`,
                [campaignId]
            );

            return {
                campaign: metrics,
                performance: performance,
                messages: logs.rows,
                generated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erro ao exportar relatório:', error);
            throw error;
        }
    }

    /**
     * Calcula health score da campanha (0-100)
     */
    calculateHealthScore(campaign) {
        let score = 100;

        // Penalizar por taxa de erro
        if (campaign.error_rate > 10) score -= 30;
        else if (campaign.error_rate > 5) score -= 15;
        else if (campaign.error_rate > 2) score -= 5;

        // Penalizar por baixa taxa de sucesso
        if (campaign.success_rate < 70) score -= 25;
        else if (campaign.success_rate < 85) score -= 10;

        // Penalizar por velocidade muito baixa
        if (campaign.messages_per_minute < 0.5) score -= 15;

        // Bonus por campanha completa e bem-sucedida
        if (campaign.status === 'completed' && campaign.success_rate > 95) {
            score += 10;
        }

        return Math.max(0, Math.min(100, score));
    }
}

module.exports = new AnalyticsService();
