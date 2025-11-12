// =====================================================
// SISTEMA DE AUTENTICAÇÃO - INTEGRADO COM API
// =====================================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        showAlert('Autenticando...', 'info');
        
        const response = await api.login(email, password);
        
        showAlert(response.message, 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        
    } catch (error) {
        showAlert(error.message || 'Erro ao fazer login', 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const senha = document.getElementById('regSenha').value;
    const senhaConfirm = document.getElementById('regSenhaConfirm').value;
    
    if (senha !== senhaConfirm) {
        showAlert('As senhas não coincidem!', 'error');
        return;
    }
    
    const userData = {
        username: document.getElementById('regEmail').value.split('@')[0],
        email: document.getElementById('regEmail').value,
        password: senha,
        firstName: document.getElementById('regNome').value,
        lastName: document.getElementById('regSobrenome').value,
        phone: document.getElementById('regTelefone').value
    };
    
    try {
        showAlert('Criando conta...', 'info');
        
        const response = await api.register(userData);
        
        showAlert(response.message, 'success');
        
        setTimeout(() => {
            showLogin();
        }, 2000);
        
    } catch (error) {
        showAlert(error.message || 'Erro ao criar conta', 'error');
    }
}

function showAlert(message, type = 'success') {
    const alert = document.getElementById('alertMessage');
    alert.textContent = message;
    alert.className = `alert-message show ${type}`;
    
    setTimeout(() => {
        alert.classList.remove('show');
    }, 3000);
}

function showLogin() {
    document.getElementById('loginForm').style.display = 'flex';
    document.getElementById('registerForm').style.display = 'none';
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'flex';
}

// Verificar se já está logado
if (api.isAuthenticated()) {
    window.location.href = 'index.html';
}

// Máscara de telefone
document.addEventListener('DOMContentLoaded', () => {
    const telInput = document.getElementById('regTelefone');
    if (telInput) {
        telInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 11) value = value.slice(0, 11);
            
            if (value.length > 6) {
                value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
            } else if (value.length > 2) {
                value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
            }
            
            e.target.value = value;
        });
    }
});
