const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseContactsFile } = require('../utils/fileParser');
const { pool } = require('../config/database');

// Usar pasta temporária do sistema
const uploadDir = process.env.NODE_ENV === 'production' 
    ? path.join(os.tmpdir(), 'rapidflow-uploads')
    : path.join(__dirname, '../../uploads');

// Criar pasta se não existir
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`📁 Pasta de uploads criada: ${uploadDir}`);
}

// Configurar multer para usar a pasta correta
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.csv', '.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos CSV e Excel são permitidos'));
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

            console.log(`📄 Processando arquivo: ${req.file.originalname}`);
            console.log(`📂 Caminho: ${req.file.path}`);

            // Parse do arquivo
            const contacts = await parseContactsFile(req.file.path);

            // Limpar arquivo temporário
            fs.unlinkSync(req.file.path);
            console.log(`🗑️ Arquivo temporário removido`);

            res.json({
                success: true,
                message: `${contacts.length} contatos carregados com sucesso!`,
                contacts: contacts
            });

        } catch (error) {
            console.error('❌ Erro ao processar arquivo:', error);
            
            // Limpar arquivo em caso de erro
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({
                success: false,
                message: 'Erro ao processar arquivo: ' + error.message
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

        // Salvar campanha no banco
        const result = await pool.query(
            `INSERT INTO campaigns (user_id, name, contacts, config, status, total_contacts, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id, name, status, created_at`,
            [userId, name, JSON.stringify(contacts), JSON.stringify(config), 'pending', contacts.length]
        );

        res.json({
            success: true,
            message: 'Campanha criada com sucesso!',
            campaign: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar campanha:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao criar campanha: ' + error.message
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
