const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseContactsFile } = require('../utils/fileParser');
const { pool } = require('../config/database');

// Determinar pasta de upload baseado no ambiente
const getUploadDir = () => {
    if (process.env.NODE_ENV === 'production') {
        const tmpDir = path.join(os.tmpdir(), 'rapidflow-uploads');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
            console.log(`📁 Pasta temp criada: ${tmpDir}`);
        }
        return tmpDir;
    } else {
        const localDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
        }
        return localDir;
    }
};

// Configurar multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = getUploadDir();
        console.log(`📂 Upload dir: ${uploadDir}`);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        console.log(`📝 Nome do arquivo: ${uniqueName}`);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.csv', '.xlsx', '.xls'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo não permitido'));
        }
    }
});

// Upload de contatos
exports.uploadContacts = [
    upload.single('file'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Nenhum arquivo enviado'
                });
            }

            console.log(`✅ Arquivo recebido: ${req.file.originalname}`);
            console.log(`📂 Salvo em: ${req.file.path}`);
            console.log(`📊 Tamanho: ${req.file.size} bytes`);

            // Verificar se arquivo existe
            if (!fs.existsSync(req.file.path)) {
                throw new Error(`Arquivo não encontrado: ${req.file.path}`);
            }

            // Parse do arquivo
            const contacts = await parseContactsFile(req.file.path);

            // Limpar arquivo temporário
            fs.unlinkSync(req.file.path);
            console.log(`🗑️ Arquivo temporário removido`);

            res.json({
                success: true,
                message: `${contacts.length} contatos carregados!`,
                contacts: contacts
            });

        } catch (error) {
            console.error('❌ Erro no upload:', error);
            
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
];

// Criar campanha
exports.createCampaign = async (req, res) => {
    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.id;

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Nenhum contato fornecido'
            });
        }

        const result = await pool.query(
            `INSERT INTO campaigns (user_id, name, contacts, config, status, total_contacts, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id, name, status, created_at`,
            [userId, name, JSON.stringify(contacts), JSON.stringify(config), 'pending', contacts.length]
        );

        res.json({
            success: true,
            message: 'Campanha criada!',
            campaign: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Listar campanhas
exports.listCampaigns = async (req, res) => {
    try {
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        let query = 'SELECT id, name, status, total_contacts, sent_count, error_count, created_at FROM campaigns';
        let params = [];

        if (!isAdmin) {
            query += ' WHERE user_id = $1';
            params.push(userId);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            campaigns: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar campanhas:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao listar campanhas'
        });
    }
};

// Detalhes da campanha
exports.getCampaignDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const isAdmin = req.user.role === 'admin';

        let query = 'SELECT * FROM campaigns WHERE id = $1';
        let params = [id];

        if (!isAdmin) {
            query += ' AND user_id = $2';
            params.push(userId);
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Campanha não encontrada'
            });
        }

        res.json({
            success: true,
            campaign: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar campanha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar campanha'
        });
    }
};
