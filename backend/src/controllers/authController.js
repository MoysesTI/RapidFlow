const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Registrar novo usuário
async function register(req, res) {
    try {
        const { username, email, password, firstName, lastName, phone } = req.body;
        
        // Validações
        if (!username || !email || !password || !firstName || !lastName) {
            return res.status(400).json({ 
                error: true, 
                message: 'Todos os campos obrigatórios devem ser preenchidos' 
            });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ 
                error: true, 
                message: 'A senha deve ter no mínimo 6 caracteres' 
            });
        }
        
        // Verificar se usuário já existe
        const checkUser = await pool.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );
        
        if (checkUser.rows.length > 0) {
            return res.status(400).json({ 
                error: true, 
                message: 'Email ou nome de usuário já cadastrado' 
            });
        }
        
        // Hash da senha
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Inserir usuário
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, first_name, last_name, phone, role)
             VALUES ($1, $2, $3, $4, $5, $6, 'user')
             RETURNING id, username, email, first_name, last_name, role`,
            [username, email, passwordHash, firstName, lastName, phone]
        );
        
        const user = result.rows[0];
        
        // Criar configuração padrão
        await pool.query(
            `INSERT INTO user_configs (user_id, webhook_url, evolution_endpoint, evolution_api_key)
             VALUES ($1, $2, $3, $4)`,
            [
                user.id,
                process.env.DEFAULT_WEBHOOK_URL,
                process.env.DEFAULT_EVOLUTION_ENDPOINT,
                process.env.DEFAULT_EVOLUTION_API_KEY
            ]
        );
        
        // Log de auditoria
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [user.id, 'USER_REGISTERED', 'user', user.id, req.ip]
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name
            }
        });
        
    } catch (error) {
        console.error('Erro no registro:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao registrar usuário' 
        });
    }
}

// Login
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                error: true, 
                message: 'Email e senha são obrigatórios' 
            });
        }
        
        // Buscar usuário
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1 AND is_active = true',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ 
                error: true, 
                message: 'Email ou senha incorretos' 
            });
        }
        
        const user = result.rows[0];
        
        // Verificar senha
        const validPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ 
                error: true, 
                message: 'Email ou senha incorretos' 
            });
        }
        
        // Gerar JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.email, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
        );
        
        // Atualizar último login
        await pool.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );
        
        // Log de auditoria
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, ip_address) VALUES ($1, $2, $3, $4)',
            [user.id, 'USER_LOGIN', 'user', req.ip]
        );
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao fazer login' 
        });
    }
}

// Verificar autenticação
async function verifyAuth(req, res) {
    try {
        const result = await pool.query(
            'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = $1 AND is_active = true',
            [req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                error: true, 
                message: 'Usuário não encontrado' 
            });
        }
        
        res.json({
            success: true,
            user: result.rows[0]
        });
        
    } catch (error) {
        console.error('Erro ao verificar auth:', error);
        res.status(500).json({ 
            error: true, 
            message: 'Erro ao verificar autenticação' 
        });
    }
}

module.exports = { register, login, verifyAuth };
