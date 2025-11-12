const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { parseContactsFile } = require('../utils/fileParser');
const { pool } = require('../config/database');

console.log('==== CAMPAIGN CONTROLLER LOADED ====');

const UPLOAD_DIR = '/tmp/rapidflow-uploads';

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('Upload dir created:', UPLOAD_DIR);
}

const upload = multer({
    dest: UPLOAD_DIR,
    limits: { fileSize: 5 * 1024 * 1024 }
});

exports.uploadContacts = [
    upload.single('file'),
    async (req, res) => {
        console.log('==== UPLOAD START ====');
        
        let filePath = null;
        
        try {
            if (!req.file) {
                console.log('No file received');
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }

            filePath = req.file.path;
            
            console.log('Original name:', req.file.originalname);
            console.log('File path:', filePath);
            console.log('Destination:', req.file.destination);
            console.log('File exists:', fs.existsSync(filePath));

            if (!fs.existsSync(filePath)) {
                throw new Error('File not saved: ' + filePath);
            }

            const contacts = await parseContactsFile(filePath);
            console.log('Contacts loaded:', contacts.length);

            fs.unlinkSync(filePath);
            console.log('File deleted');
            console.log('==== UPLOAD SUCCESS ====');

            res.json({
                success: true,
                message: contacts.length + ' contacts loaded successfully',
                contacts: contacts
            });

        } catch (error) {
            console.error('==== UPLOAD ERROR ====');
            console.error('Error message:', error.message);
            console.error('Stack:', error.stack);
            
            if (filePath && fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log('Cleanup: file deleted');
                } catch (cleanupErr) {
                    console.error('Cleanup error:', cleanupErr);
                }
            }

            res.status(500).json({
                success: false,
                message: 'Error: ' + error.message
            });
        }
    }
];

exports.createCampaign = async (req, res) => {
    try {
        const { name, contacts, config } = req.body;
        const userId = req.user.userId;

        if (!contacts || contacts.length === 0) {
            return res.status(400).json({ success: false, message: 'No contacts' });
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