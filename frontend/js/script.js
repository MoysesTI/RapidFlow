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
            systemPrompt: document.getElementById('systemPrompt').value
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

document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm('Deseja sair?')) {
        api.logout();
    }
});

// Inicializar
loadUserData();
loadConfig();
addLog('✅ Sistema pronto - Todos podem editar!', 'success');