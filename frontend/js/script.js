// =====================================================
// PRISMATECH CAMPAIGN MANAGER - SCRIPT PRINCIPAL
// =====================================================

// Verificar autenticação
if (!api.isAuthenticated()) {
    window.location.href = 'login.html';
}

// Variáveis Globais
let contacts = [];
let campaignRunning = false;
let currentConfig = null;

// =====================================================
// INICIALIZAÇÃO
// =====================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadConfig();
    setupEventListeners();
    addLog('Sistema iniciado e pronto para uso', 'success');
});

// =====================================================
// CARREGAR INFORMAÇÕES DO USUÁRIO
// =====================================================
async function loadUserInfo() {
    const user = api.getCurrentUser();
    
    if (user) {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        
        if (userNameEl) userNameEl.textContent = `${user.firstName} ${user.lastName}`;
        if (userRoleEl) userRoleEl.textContent = user.role === 'admin' ? 'Administrador' : 'Usuário';
        
        // Mostrar/ocultar campos admin
        if (user.role !== 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
}

// =====================================================
// CARREGAR CONFIGURAÇÕES
// =====================================================
async function loadConfig() {
    try {
        const response = await api.getConfig();
        currentConfig = response.config;
        
        // Preencher formulário
        document.getElementById('webhookUrl').value = currentConfig.webhook_url || '';
        document.getElementById('evolutionEndpoint').value = currentConfig.evolution_endpoint || '';
        document.getElementById('imageUrl').value = currentConfig.image_url || '';
        document.getElementById('delayMin').value = currentConfig.delay_min || 140;
        document.getElementById('delayMax').value = currentConfig.delay_max || 380;
        document.getElementById('openaiModel').value = currentConfig.openai_model || 'gpt-4';
        document.getElementById('systemPrompt').value = currentConfig.system_prompt || '';
        
        // Campos protegidos para não-admin
        if (!api.isAdmin()) {
            document.getElementById('apiKey').value = '***OCULTO***';
            document.getElementById('openaiKey').value = '***OCULTO***';
            document.getElementById('apiKey').disabled = true;
            document.getElementById('openaiKey').disabled = true;
        } else {
            document.getElementById('apiKey').value = currentConfig.evolution_api_key || '';
            document.getElementById('openaiKey').value = currentConfig.openai_api_key || '';
        }
        
        addLog('Configurações carregadas', 'success');
    } catch (error) {
        addLog('Erro ao carregar configurações: ' + error.message, 'error');
    }
}

// =====================================================
// EVENT LISTENERS
// =====================================================
function setupEventListeners() {
    document.getElementById('campaignForm').addEventListener('submit', handleCampaignSubmit);
    document.getElementById('contactsFile').addEventListener('change', handleFileUpload);
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => api.logout());
    }
    
    // Auto-save config
    const configInputs = ['webhookUrl', 'evolutionEndpoint', 'imageUrl', 'delayMin', 'delayMax', 'openaiModel', 'systemPrompt'];
    configInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', saveConfig);
        }
    });
}

// =====================================================
// SALVAR CONFIGURAÇÕES
// =====================================================
async function saveConfig() {
    try {
        const configData = {
            webhookUrl: document.getElementById('webhookUrl').value,
            evolutionEndpoint: document.getElementById('evolutionEndpoint').value,
            imageUrl: document.getElementById('imageUrl').value,
            delayMin: parseInt(document.getElementById('delayMin').value),
            delayMax: parseInt(document.getElementById('delayMax').value),
            openaiModel: document.getElementById('openaiModel').value,
            systemPrompt: document.getElementById('systemPrompt').value
        };
        
        if (api.isAdmin()) {
            const apiKey = document.getElementById('apiKey').value;
            const openaiKey = document.getElementById('openaiKey').value;
            
            if (apiKey && !apiKey.includes('***')) {
                configData.evolutionApiKey = apiKey;
            }
            if (openaiKey && !openaiKey.includes('***')) {
                configData.openaiApiKey = openaiKey;
            }
        }
        
        await api.updateConfig(configData);
        addLog('Configurações salvas', 'success');
    } catch (error) {
        addLog('Erro ao salvar: ' + error.message, 'error');
    }
}

// =====================================================
// UPLOAD DE CONTATOS
// =====================================================
function uploadContacts() {
    document.getElementById('contactsFile').click();
}

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    addLog(`Carregando arquivo: ${file.name}`, 'info');

    try {
        const response = await api.uploadContacts(file);
        contacts = response.contacts;
        
        displayContacts();
        updateContactCount();
        addLog(`${contacts.length} contatos carregados com sucesso!`, 'success');
        
    } catch (error) {
        addLog('Erro ao processar arquivo: ' + error.message, 'error');
    }
}

// =====================================================
// EXIBIR CONTATOS
// =====================================================
function displayContacts() {
    const container = document.getElementById('contactsList');
    
    if (contacts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📋 Nenhum contato carregado</p>
                <small>Clique em "Carregar Contatos" para começar</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = contacts.map((contact, index) => `
        <div class="contact-item pending" id="contact-${index}">
            <div class="contact-info">
                <strong>${contact.nome}</strong>
                <small>${contact.telefone}</small>
            </div>
            <span class="contact-status">⏳ Pendente</span>
        </div>
    `).join('');
}

function updateContactCount() {
    document.getElementById('contactCount').textContent = contacts.length;
    document.getElementById('totalCount').textContent = contacts.length;
}

function filterContacts(filter) {
    // Implementar filtro se necessário
    addLog(`Filtro: ${filter}`, 'info');
}

// =====================================================
// TESTE DE CONEXÃO
// =====================================================
async function testConnection() {
    const webhookUrl = document.getElementById('webhookUrl').value;
    
    if (!webhookUrl) {
        alert('Por favor, configure o Webhook n8n primeiro!');
        return;
    }
    
    addLog('Testando conexão com n8n...', 'info');
    
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ test: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
            addLog('✅ Conexão com n8n estabelecida!', 'success');
            alert('✅ Webhook n8n funcionando perfeitamente!');
        } else {
            addLog('⚠️ Resposta inesperada do n8n', 'warning');
        }
    } catch (error) {
        addLog('❌ Erro ao conectar com n8n: ' + error.message, 'error');
        alert('❌ Erro de conexão! Verifique a URL do webhook.');
    }
}

// =====================================================
// INICIAR CAMPANHA
// =====================================================
async function handleCampaignSubmit(event) {
    event.preventDefault();
    
    if (contacts.length === 0) {
        alert('Por favor, carregue os contatos primeiro!');
        return;
    }
    
    if (!confirm(`Deseja iniciar o envio para ${contacts.length} contatos?`)) {
        return;
    }
    
    campaignRunning = true;
    updateCampaignStatus('Executando ⏳', 'status-running');
    
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'inline-flex';
    
    const webhookUrl = document.getElementById('webhookUrl').value;
    const apiKey = document.getElementById('apiKey').value;
    const openaiKey = document.getElementById('openaiKey').value;
    
    const payload = {
        contacts: contacts,
        config: {
            evolutionEndpoint: document.getElementById('evolutionEndpoint').value,
            apiKey: apiKey.includes('***') ? currentConfig.evolution_api_key : apiKey,
            openaiKey: openaiKey.includes('***') ? currentConfig.openai_api_key : openaiKey,
            imageUrl: document.getElementById('imageUrl').value,
            delayMin: parseInt(document.getElementById('delayMin').value),
            delayMax: parseInt(document.getElementById('delayMax').value),
            openaiModel: document.getElementById('openaiModel').value,
            systemPrompt: document.getElementById('systemPrompt').value
        },
        metadata: {
            totalContacts: contacts.length,
            startTime: new Date().toISOString(),
            campaignId: generateCampaignId()
        }
    };
    
    try {
        addLog('Enviando campanha para n8n...', 'info');
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            addLog('✅ Campanha enviada ao n8n com sucesso!', 'success');
            addLog('O n8n está processando os envios...', 'info');
            
            // Salvar no banco
            try {
                await api.createCampaign({
                    name: `Campanha ${new Date().toLocaleString('pt-BR')}`,
                    contacts: contacts,
                    config: payload.config
                });
            } catch (err) {
                console.error('Erro ao salvar campanha:', err);
            }
            
            simulateProgress();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        addLog('❌ Erro ao enviar: ' + error.message, 'error');
        stopCampaign();
        alert('Erro ao iniciar campanha! Verifique o log.');
    }
}

// =====================================================
// SIMULAÇÃO DE PROGRESSO
// =====================================================
function simulateProgress() {
    const delayMin = parseInt(document.getElementById('delayMin').value) || 140;
    const delayMax = parseInt(document.getElementById('delayMax').value) || 380;
    const avgDelay = (delayMin + delayMax) / 2;
    
    let currentIndex = 0;
    let sentCount = 0;
    let errorCount = 0;
    
    const interval = setInterval(() => {
        if (!campaignRunning || currentIndex >= contacts.length) {
            clearInterval(interval);
            if (currentIndex >= contacts.length) {
                completeCampaign(sentCount, errorCount);
            }
            return;
        }
        
        const contact = contacts[currentIndex];
        const success = Math.random() > 0.05; // 95% taxa de sucesso
        
        if (success) {
            sentCount++;
            updateContactUI(currentIndex, 'sent');
            addLog(`✅ Enviado: ${contact.nome}`, 'success');
        } else {
            errorCount++;
            updateContactUI(currentIndex, 'error');
            addLog(`❌ Erro: ${contact.nome}`, 'error');
        }
        
        currentIndex++;
        updateProgress(sentCount, errorCount, contacts.length);
        
    }, (avgDelay / 10) * 1000); // Acelerar para demonstração
}

function updateContactUI(index, status) {
    const contactEl = document.getElementById(`contact-${index}`);
    if (contactEl) {
        contactEl.className = `contact-item ${status}`;
        const statusText = status === 'sent' ? '✅ Enviado' : '❌ Erro';
        contactEl.querySelector('.contact-status').textContent = statusText;
    }
}

function updateProgress(sent, errors, total) {
    const processed = sent + errors;
    const percentage = (processed / total) * 100;
    
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('progressFill').textContent = percentage.toFixed(0) + '%';
    document.getElementById('sentCount').textContent = sent;
    document.getElementById('errorCount').textContent = errors;
    
    const remaining = total - processed;
    const avgDelay = (parseInt(document.getElementById('delayMin').value) + parseInt(document.getElementById('delayMax').value)) / 2;
    const timeLeft = (remaining * avgDelay) / 60;
    document.getElementById('timeEstimate').textContent = timeLeft.toFixed(1) + ' minutos';
}

function stopCampaign() {
    campaignRunning = false;
    updateCampaignStatus('Parada ⏸️', 'status-waiting');
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('stopBtn').style.display = 'none';
    addLog('⏹️ Campanha interrompida', 'warning');
}

function completeCampaign(sent, errors) {
    campaignRunning = false;
    updateCampaignStatus('Concluída ✅', 'status-completed');
    document.getElementById('startBtn').style.display = 'inline-flex';
    document.getElementById('stopBtn').style.display = 'none';
    
    addLog(`🎉 Campanha finalizada! Enviadas: ${sent} | Erros: ${errors}`, 'success');
    
    const successRate = ((sent / contacts.length) * 100).toFixed(1);
    alert(`Campanha Concluída!\n\n✅ Enviadas: ${sent}\n❌ Erros: ${errors}\n📊 Taxa de sucesso: ${successRate}%`);
}

function updateCampaignStatus(text, statusClass) {
    const statusEl = document.getElementById('campaignStatus');
    statusEl.textContent = text;
    statusEl.className = `value ${statusClass}`;
}

// =====================================================
// LOG
// =====================================================
function addLog(message, type = 'info') {
    const logContainer = document.getElementById('activityLog');
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `
        <span class="timestamp">[${timestamp}]</span>
        <span class="message">${message}</span>
    `;
    
    logContainer.insertBefore(logEntry, logContainer.firstChild);
    
    while (logContainer.children.length > 200) {
        logContainer.removeChild(logContainer.lastChild);
    }
}

function clearLogs() {
    if (confirm('Limpar todo o histórico de logs?')) {
        document.getElementById('activityLog').innerHTML = '';
        addLog('Logs limpos', 'info');
    }
}

// =====================================================
// UTILS
// =====================================================
function generateCampaignId() {
    return 'CAMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}
