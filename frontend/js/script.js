// =====================================================
// RAPIDFLOW - TODOS PODEM EDITAR CONFIGURAÇÕES
// =====================================================

let contacts = [];
let campaignRunning = false;
let currentCampaignId = null;

// Verificar autenticação
if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Carregar usuário
async function loadUserData() {
    try {
        const user = api.getCurrentUser();
        document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
        document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrador' : 'Usuário';
    } catch (error) {
        console.error('Erro ao carregar usuário:', error);
    }
}

// Carregar configurações - SEM RESTRIÇÃO DE ADMIN
async function loadConfig() {
    try {
        console.log('📥 Carregando configurações...');
        const response = await api.getConfig();
        
        if (response.success && response.config) {
            const c = response.config;
            
            // PREENCHER TODOS OS CAMPOS PARA TODOS OS USUÁRIOS
            document.getElementById('webhookUrl').value = c.webhook_url || '';
            document.getElementById('evolutionEndpoint').value = c.evolution_endpoint || '';
            document.getElementById('apiKey').value = c.evolution_api_key || '';
            document.getElementById('openaiKey').value = c.openai_api_key || '';
            document.getElementById('imageUrl').value = c.image_url || '';
            document.getElementById('delayMin').value = c.delay_min || 140;
            document.getElementById('delayMax').value = c.delay_max || 380;
            document.getElementById('openaiModel').value = c.openai_model || 'gpt-4';
            document.getElementById('systemPrompt').value = c.system_prompt || '';
            document.getElementById('useAI').checked = c.use_ai !== false; // Default: true
            document.getElementById('maxRetries').value = c.max_retries || 3;
            
            console.log('✅ Configurações carregadas para TODOS os usuários');
            addLog('✅ Configurações carregadas', 'success');
        }
    } catch (error) {
        console.error('Erro ao carregar config:', error);
        addLog('⚠️ Erro ao carregar configurações', 'warning');
    }
}

// Upload de contatos
function uploadContacts() {
    document.getElementById('contactsFile').click();
}

document.getElementById('contactsFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        addLog('📤 Fazendo upload...', 'info');
        const response = await api.uploadContacts(file);
        
        if (response.success) {
            contacts = response.contacts;
            displayContacts(contacts);
            addLog(`✅ ${contacts.length} contatos carregados!`, 'success');
            document.getElementById('totalCount').textContent = contacts.length;
        }
    } catch (error) {
        addLog('❌ Erro: ' + error.message, 'error');
    }
});

function displayContacts(list) {
    const container = document.getElementById('contactsList');
    document.getElementById('contactCount').textContent = list.length;
    
    if (list.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Nenhum contato carregado</p></div>';
        return;
    }
    
    container.innerHTML = list.slice(0, 50).map((c, i) => `
        <div class="contact-item">
            <span class="contact-number">${i + 1}</span>
            <div class="contact-info">
                <strong>${c.nome}</strong>
                <small>${c.telefone}</small>
            </div>
        </div>
    `).join('');
    
    if (list.length > 50) {
        container.innerHTML += `<div class="contact-item"><p>... e mais ${list.length - 50} contatos</p></div>`;
    }
}

// Testar conexão
async function testConnection() {
    const url = document.getElementById('webhookUrl').value;
    
    if (!url) {
        addLog('❌ Preencha a URL do webhook!', 'error');
        return;
    }
    
    try {
        addLog('🔄 Testando...', 'info');
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addLog('✅ Conexão OK!', 'success');
        } else {
            addLog('⚠️ Webhook respondeu mas pode haver problema', 'warning');
        }
    } catch (error) {
        addLog('❌ Erro: ' + error.message, 'error');
    }
}

// Iniciar campanha
document.getElementById('campaignForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (contacts.length === 0) {
        addLog('❌ Carregue os contatos primeiro!', 'error');
        return;
    }
    
    try {
        addLog('🚀 Iniciando campanha...', 'info');
        
        const config = {
            webhookUrl: document.getElementById('webhookUrl').value,
            evolutionEndpoint: document.getElementById('evolutionEndpoint').value,
            apiKey: document.getElementById('apiKey').value,
            openaiKey: document.getElementById('openaiKey').value,
            imageUrl: document.getElementById('imageUrl').value,
            delayMin: parseInt(document.getElementById('delayMin').value),
            delayMax: parseInt(document.getElementById('delayMax').value),
            openaiModel: document.getElementById('openaiModel').value,
            systemPrompt: document.getElementById('systemPrompt').value,
            useAI: document.getElementById('useAI').checked,
            maxRetries: parseInt(document.getElementById('maxRetries').value)
        };
        
        console.log('📤 Enviando config:', config);
        
        const campaignResponse = await api.createCampaign({
            name: `Campanha ${new Date().toLocaleDateString()}`,
            contacts: contacts,
            config: config
        });
        
        if (campaignResponse.success) {
            currentCampaignId = campaignResponse.campaign.id;
            addLog('✅ Campanha criada!', 'success');
            
            addLog('📤 Enviando para processamento...', 'info');
            
            const executeResponse = await api.request(`/campaigns/${currentCampaignId}/execute`, {
                method: 'POST'
            });
            
            if (executeResponse.success) {
                campaignRunning = true;
                document.getElementById('campaignStatus').textContent = 'Em Execução';
                document.getElementById('campaignStatus').parentElement.className = 'status-item status-running';
                document.getElementById('startBtn').style.display = 'none';
                document.getElementById('stopBtn').style.display = 'inline-flex';

                addLog('✅ Campanha iniciada!', 'success');

                const avgDelay = (config.delayMin + config.delayMax) / 2;
                const estimatedMinutes = Math.ceil((contacts.length * avgDelay) / 60);
                document.getElementById('timeEstimate').textContent = `~${estimatedMinutes} min`;

                // Iniciar polling de progresso
                startProgressPolling();
            }
        }
    } catch (error) {
        addLog('❌ Erro: ' + error.message, 'error');
    }
});

function stopCampaign() {
    if (confirm('Parar campanha?')) {
        campaignRunning = false;
        document.getElementById('campaignStatus').textContent = 'Parada';
        document.getElementById('campaignStatus').parentElement.className = 'status-item status-stopped';
        document.getElementById('startBtn').style.display = 'inline-flex';
        document.getElementById('stopBtn').style.display = 'none';
        stopProgressPolling();
        addLog('⏸️ Campanha parada', 'warning');
    }
}

function addLog(message, type = 'info') {
    const container = document.getElementById('activityLog');
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    
    const time = new Date().toLocaleTimeString('pt-BR');
    entry.innerHTML = `
        <span class="log-time">[${time}]</span>
        <span class="log-message">${message}</span>
    `;
    
    container.insertBefore(entry, container.firstChild);
    
    if (container.children.length > 100) {
        container.removeChild(container.lastChild);
    }
}

function clearLogs() {
    document.getElementById('activityLog').innerHTML = '';
    addLog('🗑️ Logs limpos', 'info');
}

// =====================================================
// NOVAS FUNCIONALIDADES - LOGS E POLLING
// =====================================================

let pollingInterval = null;
let messageFilter = 'all';

// Iniciar polling de progresso
function startProgressPolling() {
    if (pollingInterval) clearInterval(pollingInterval);

    pollingInterval = setInterval(async () => {
        if (!currentCampaignId || !campaignRunning) {
            stopProgressPolling();
            return;
        }

        try {
            const details = await api.getCampaignDetails(currentCampaignId);
            if (details.success && details.campaign) {
                updateDashboard(details.campaign);
            }
        } catch (error) {
            console.error('Erro ao buscar progresso:', error);
        }
    }, 5000); // A cada 5 segundos

    addLog('🔄 Monitoramento em tempo real ativado', 'info');
}

// Parar polling
function stopProgressPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        addLog('⏸️ Monitoramento pausado', 'info');
    }
}

// Atualizar dashboard com dados da campanha
function updateDashboard(campaign) {
    // Atualizar contadores
    document.getElementById('sentCount').textContent = campaign.sent_count || 0;
    document.getElementById('errorCount').textContent = campaign.error_count || 0;
    document.getElementById('totalCount').textContent = campaign.total_contacts || 0;

    // Calcular e atualizar progresso
    const total = campaign.total_contacts || 0;
    const sent = campaign.sent_count || 0;
    const percentage = total > 0 ? Math.round((sent / total) * 100) : 0;

    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = percentage + '%';
    progressFill.textContent = percentage + '%';

    // Atualizar taxa de sucesso
    if (campaign.success_rate !== null && campaign.success_rate !== undefined) {
        document.getElementById('successRate').textContent = campaign.success_rate.toFixed(1) + '%';
    } else if (sent > 0) {
        const errors = campaign.error_count || 0;
        const successRate = ((sent - errors) / sent) * 100;
        document.getElementById('successRate').textContent = successRate.toFixed(1) + '%';
    }

    // Atualizar status
    if (campaign.status === 'completed') {
        document.getElementById('campaignStatus').textContent = 'Concluída';
        document.getElementById('campaignStatus').parentElement.className = 'status-item status-completed';
        campaignRunning = false;
        stopProgressPolling();
        addLog('✅ Campanha finalizada com sucesso!', 'success');

        // Carregar logs finais
        loadCampaignLogs();
    } else if (campaign.status === 'running') {
        document.getElementById('campaignStatus').textContent = 'Em Execução';
        document.getElementById('campaignStatus').parentElement.className = 'status-item status-running';
    }
}

// Carregar logs de mensagens
async function loadCampaignLogs() {
    if (!currentCampaignId) return;

    try {
        const response = await api.getCampaignLogs(currentCampaignId);

        if (response.success && response.logs) {
            displayMessages(response.logs);
            addLog(`📊 ${response.logs.length} mensagens carregadas`, 'info');
        }
    } catch (error) {
        console.error('Erro ao carregar logs:', error);
        addLog('⚠️ Erro ao carregar logs de mensagens', 'warning');
    }
}

// Exibir mensagens
function displayMessages(messages) {
    if (messages.length === 0) return;

    // Mostrar card de mensagens
    document.getElementById('messagesCard').style.display = 'block';
    document.getElementById('messagesCount').textContent = messages.length;

    const container = document.getElementById('messagesList');
    container.innerHTML = '';

    messages.forEach(msg => {
        if (messageFilter !== 'all' && msg.status !== messageFilter) return;

        const item = document.createElement('div');
        item.className = 'message-item';
        item.dataset.status = msg.status;

        const statusBadge = msg.status === 'sent'
            ? '<span class="message-badge sent">✅ Enviada</span>'
            : '<span class="message-badge error">❌ Erro</span>';

        const sentTime = msg.sent_at
            ? new Date(msg.sent_at).toLocaleString('pt-BR')
            : new Date(msg.created_at).toLocaleString('pt-BR');

        const messageContent = msg.status === 'sent'
            ? `<div class="message-text">${msg.message_text}</div>`
            : `<div class="message-error">❌ ${msg.error_message || 'Erro desconhecido'}</div>`;

        item.innerHTML = `
            <div class="message-info">
                <div class="message-contact">${msg.contact_name}</div>
                <div class="message-phone">📱 ${msg.phone}</div>
                ${messageContent}
            </div>
            <div class="message-status">
                ${statusBadge}
                <div class="message-time">⏰ ${sentTime}</div>
            </div>
        `;

        container.appendChild(item);
    });
}

// Filtrar mensagens
function filterMessages(filter) {
    messageFilter = filter;

    // Atualizar botões ativos
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Filtrar itens visíveis
    const items = document.querySelectorAll('.message-item');
    items.forEach(item => {
        if (filter === 'all' || item.dataset.status === filter) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Deseja sair?')) {
        stopProgressPolling();
        api.logout();
    }
});

// Inicializar
loadUserData();
loadConfig();
addLog('✅ Sistema pronto - Todos podem editar!', 'success');