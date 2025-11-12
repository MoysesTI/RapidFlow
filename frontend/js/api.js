// =====================================================
// API CLIENT - COMUNICAÇÃO COM BACKEND
// =====================================================

const API_URL = 'http://localhost:5000/api';

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('prismatech_token');
    }

    async request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('prismatech_token', response.token);
            localStorage.setItem('prismatech_user', JSON.stringify(response.user));
        }
        
        return response;
    }

    async verifyAuth() {
        return this.request('/auth/verify');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('prismatech_token');
        localStorage.removeItem('prismatech_user');
        window.location.href = 'login.html';
    }

    // Config
    async getConfig() {
        return this.request('/config');
    }

    async updateConfig(configData) {
        return this.request('/config', {
            method: 'PUT',
            body: JSON.stringify(configData)
        });
    }

    // Campaigns
    async uploadContacts(file) {
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${API_URL}/campaigns/upload-contacts`, {
            method: 'POST',
            headers,
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao fazer upload');
        }

        return data;
    }

    async createCampaign(campaignData) {
        return this.request('/campaigns', {
            method: 'POST',
            body: JSON.stringify(campaignData)
        });
    }

    async listCampaigns() {
        return this.request('/campaigns');
    }

    async getCampaignDetails(id) {
        return this.request(`/campaigns/${id}`);
    }

    // Helpers
    getCurrentUser() {
        const userStr = localStorage.getItem('prismatech_user');
        return userStr ? JSON.parse(userStr) : null;
    }

    isAdmin() {
        const user = this.getCurrentUser();
        return user && user.role === 'admin';
    }

    isAuthenticated() {
        return !!this.token && !!localStorage.getItem('prismatech_user');
    }
}

// Instância global
const api = new ApiClient();
