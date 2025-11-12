const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseContactsFile } = require('../utils/fileParser');
const { pool } = require('../config/database');

// Criar pasta de uploads no /tmp (Render)
const uploadDir = path.join(os.tmpdir(), 'rapidflow-uploads');

// Garantir que a pasta existe
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Upload directory created:', uploadDir);
    }
} catch (error) {
    console.error('Error creating upload directory:', error);
}

// Configurar Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Saving file to:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        console.log('Generated filename:', uniqueName);
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedExts = ['.csv', '.xlsx', '.xls'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV and Excel files are allowed'));
        }
    }
});

// Upload de contatos
exports.uploadContacts = [
    upload.single('file'),
    async (req, res) => {
        try {
            console.log('=== UPLOAD STARTED ===');
            
            if (!req.file) {
                console.log('No file received');
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            console.log('File received:', req.file.originalname);
            console.log('File path:', req.file.path);
            console.log('File size:', req.file.size, 'bytes');

            // Verificar se o arquivo existe
            if (!fs.existsSync(req.file.path)) {
                throw new Error('File not found after upload: ' + req.file.path);
            }

            console.log('File exists, parsing...');

            // Parse do arquivo
            const contacts = await parseContactsFile(req.file.path);

            console.log('Parsed contacts:', contacts.length);

            // Remover arquivo temporário
            try {
                fs.unlinkSync(req.file.path);
                console.log('Temporary file deleted');
            } catch (err) {
                console.error('Error deleting temp file:', err);
            }

            console.log('=== UPLOAD COMPLETED ===');

            res.json({
                success: true,
                message: contacts.length + ' contacts loaded successfully!',
                contacts: contacts
            });

        } catch (error) {
            console.error('=== UPLOAD ERROR ===');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            
            // Limpar arquivo em caso de erro
            if (req.file && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (err) {
                    console.error('Error cleaning up file:', err);
                }
            }

            res.status(500).json({
                success: false,
                message: 'Error processing file: ' + error.message
            });
        }
    }
];

// Criar campanha
exports.createCampaign = async (req, res) => {
    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.userId;

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No contacts provided'
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
            message: 'Campaign created successfully!',
            campaign: result.rows[0]
        });

    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating campaign: ' + error.message
        });
    }
};

// Listar campanhas
exports.listCampaigns = async (req, res) => {
    try {
        const userId = req.user.userId;
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
        console.error('Error listing campaigns:', error);
        res.status(500).json({
            success: false,
            message: 'Error listing campaigns'
        });
    }
};

// Detalhes da campanha
exports.getCampaignDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
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
                message: 'Campaign not found'
            });
        }

        res.json({
            success: true,
            campaign: result.rows[0]
        });

    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching campaign'
        });
    }
};