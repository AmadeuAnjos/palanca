const express = require('express');
const router = express.Router();
const db = require('./db');
const { body, validationResult } = require('express-validator');
const cors = require('cors');

router.use(express.json());
router.use(cors());

// Validações mais robustas
const validateMessage = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres'),
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido'),
    body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Mensagem deve ter entre 10 e 1000 caracteres')
];

// Criar tabela de mensagens (com mais detalhes)
async function initializeDatabase() {
    let connection;
    try {
        connection = await db.getConnection();
        await connection.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                message TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                status ENUM('unread', 'read', 'archived') DEFAULT 'unread',
                INDEX idx_email (email),
                INDEX idx_status (status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
        console.log('Tabela de mensagens verificada/criada com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar tabela:', error);
        throw error; // Propaga o erro para tratamento superior
    } finally {
        if (connection) connection.release();
    }
}

// Inicializa o banco quando o servidor começa
initializeDatabase().catch(err => {
    console.error('Falha crítica na inicialização do banco:', err);
    process.exit(1);
});

// Rota para enviar mensagem (com validação melhorada)
router.post('/', validateMessage, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false, 
            message: 'Erro de validação',
            errors: errors.array() 
        });
    }

    let connection;
    try {
        const { name, email, message } = req.body;
        
        connection = await db.getConnection();
        
        // Verifica se é um email duplicado recente
        const [duplicates] = await connection.query(
            'SELECT id FROM messages WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) LIMIT 1',
            [email]
        );
        
        if (duplicates.length > 0) {
            return res.status(429).json({
                success: false,
                message: 'Você já enviou uma mensagem recentemente. Por favor, aguarde antes de enviar outra.'
            });
        }

        const [result] = await connection.query(
            'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
            [name, email, message.trim()]
        );
        
        res.json({ 
            success: true, 
            message: 'Mensagem enviada com sucesso',
            id: result.insertId
        });
    } catch (error) {
        console.error('Erro ao salvar mensagem:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno ao processar sua mensagem' 
        });
    } finally {
        if (connection) connection.release();
    }
});

// ... (mantenha as outras rotas como estão, mas adicione o bloco finally)

module.exports = router;