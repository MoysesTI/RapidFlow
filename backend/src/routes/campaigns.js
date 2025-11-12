const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
    uploadContacts,
    createCampaign,
    listCampaigns,
    getCampaignDetails
} = require('../controllers/campaignController');
const { authenticateToken } = require('../middleware/auth');

// Configurar multer para upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos CSV e XLSX são permitidos'));
        }
    }
});

router.post('/upload-contacts', authenticateToken, upload.single('file'), uploadContacts);
router.post('/', authenticateToken, createCampaign);
router.get('/', authenticateToken, listCampaigns);
router.get('/:id', authenticateToken, getCampaignDetails);

module.exports = router;
