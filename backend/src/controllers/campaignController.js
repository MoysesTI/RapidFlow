const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseContactsFile } = require('../utils/fileParser');
const { pool } = require('../config/database');

const uploadDir = process.env.UPLOAD_DIR || path.join(os.tmpdir(), 'rapidflow-uploads');

try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Upload directory created:', uploadDir);
    }
} catch (error) {
    console.error('Error creating upload directory:', error);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log('Destination:', uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const name = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        console.log('Filename:', name);
        cb(null, name);
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
            cb(new Error('Only CSV and Excel files allowed'));
        }
    }
});

exports.uploadContacts = [
    upload.single('file'),
    async (req, res) => {
        console.log('=== UPLOAD START ===');
        try {
            if (!req.file) {
                console.log('No file received');
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            console.log('File:', req.file.originalname);
            console.log('Path:', req.file.path);
            console.log('Size:', req.file.size);

            if (!fs.existsSync(req.file.path)) {
                throw new Error('File not found: ' + req.file.path);
            }

            const contacts = await parseContactsFile(req.file.path);
            console.log('Contacts parsed:', contacts.length);

            fs.unlinkSync(req.file.path);
            console.log('Temp file deleted');
            console.log('=== UPLOAD COMPLETE ===');

            res.json({ success: true, message: contacts.length + ' contacts loaded', contacts: contacts });

        } catch (error) {
            console.error('=== UPLOAD ERROR ===');
            console.error('Error:', error.message);
            console.error('Stack:', error.stack);
            
            if (req.file && fs.existsSync(req.file.path)) {
                try { fs.unlinkSync(req.file.path); } catch (err) {}
            }

            res.status(500).json({ success: false, message: error.message });
        }
    }
];

exports.createCampaign = async (req, res) => {
    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.userId;

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({ success: false, message: 'No contacts provided' });
        }

        const result = await pool.query(
            `INSERT INTO campaigns (user_id, name, contacts, config, status, total_contacts, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id, name, status, created_at`,
            [userId, name, JSON.stringify(contacts), JSON.stringify(config), 'pending', contacts.length]
        );

        res.json({ success: true, message: 'Campaign created', campaign: result.rows[0] });

    } catch (error) {
        console.error('Error creating campaign:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

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

        res.json({ success: true, campaigns: result.rows });

    } catch (error) {
        console.error('Error listing campaigns:', error);
        res.status(500).json({ success: false, message: 'Error listing campaigns' });
    }
};

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
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        res.json({ success: true, campaign: result.rows[0] });

    } catch (error) {
        console.error('Error fetching campaign:', error);
        res.status(500).json({ success: false, message: 'Error fetching campaign' });
    }
};