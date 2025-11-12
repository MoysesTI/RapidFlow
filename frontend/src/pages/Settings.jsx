import React, { useState, useEffect } from 'react';
import { Save, Key, Globe, AlertCircle, CheckCircle2, Settings as SettingsIcon } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  
  const [config, setConfig] = useState({
    webhookUrl: '',
    evolutionEndpoint: '',
    evolutionApiKey: '',
    openaiApiKey: ''
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setConfig({
          webhookUrl: response.data.config.webhook_url || '',
          evolutionEndpoint: response.data.config.evolution_endpoint || '',
          evolutionApiKey: response.data.config.evolution_api_key || '',
          openaiApiKey: response.data.config.openai_api_key || ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setMessage({ type: 'error', text: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/config`,
        config,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({ type: 'success', text: 'Configurações salvas com sucesso!' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar configurações' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configurações do Sistema</h1>
              <p className="text-gray-600">Configure as APIs e integrações</p>
            </div>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-fadeIn ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border-2 border-green-200' 
              : 'bg-red-50 text-red-800 border-2 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Webhook n8n
              </label>
              <input
                type="text"
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                placeholder="https://webhook.automacaoklyon.com/webhook/prisma-campaign"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5 ml-1">
                URL do webhook do n8n que processará as campanhas
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Evolution API - Endpoint
              </label>
              <input
                type="text"
                value={config.evolutionEndpoint}
                onChange={(e) => setConfig({ ...config, evolutionEndpoint: e.target.value })}
                placeholder="https://evoapi.automacaoklyon.com/message/sendMedia/prismabotmensagem"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-1.5 ml-1">
                URL completa do endpoint da Evolution API
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Key className="w-4 h-4 text-blue-600" />
                Evolution API - Key
              </label>
              <input
                type="password"
                value={config.evolutionApiKey}
                onChange={(e) => setConfig({ ...config, evolutionApiKey: e.target.value })}
                placeholder="FBAF0775D817-45C7-9ACC-F7720DDAA9E2"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5 ml-1">
                Chave de autenticação da Evolution API
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Key className="w-4 h-4 text-blue-600" />
                OpenAI API Key
                <span className="text-xs text-gray-400 font-normal">(Opcional)</span>
              </label>
              <input
                type="password"
                value={config.openaiApiKey}
                onChange={(e) => setConfig({ ...config, openaiApiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1.5 ml-1">
                Chave da OpenAI para personalização de mensagens com IA
              </p>
            </div>
          </div>

          <div className="pt-4 border-t-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 text-white px-6 py-4 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 text-lg"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">ℹ️ Informações Importantes:</p>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>Essas configurações são aplicadas a todas as suas campanhas</li>
                  <li>Mantenha suas API Keys em segurança e nunca as compartilhe</li>
                  <li>As configurações são salvas de forma segura no banco de dados</li>
                  <li>Configure antes de criar sua primeira campanha</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}