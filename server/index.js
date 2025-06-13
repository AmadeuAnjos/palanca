require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const basicAuth = require('express-basic-auth');
const { pool, initializeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:5173', 
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static('public'));
app.use(morgan('dev'));

// Rate limiting (100 requests per 15 minutes)
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Database initialization
initializeDatabase();

// Authentication setup
const authMiddleware = basicAuth({
  authorizer: async (username, password, callback) => {
    try {
      const [users] = await pool.query(
        'SELECT * FROM admin_users WHERE username = ?',
        [username]
      );
      
      if (users.length === 0) return callback(null, false);
      
      const match = await bcrypt.compare(password, users[0].password_hash);
      callback(null, match);
    } catch (error) {
      callback(error);
    }
  },
  authorizeAsync: true,
  unauthorizedResponse: { 
    success: false, 
    message: 'Acesso não autorizado' 
  }
});

async function setupAdminAuth() {
  // Create admin_users table if not exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default admin user if none exists
  const [users] = await pool.query(
    'SELECT * FROM admin_users WHERE username = ?', 
    [ADMIN_USER]
  );
  
  if (users.length === 0) {
    const hash = await bcrypt.hash(ADMIN_PASS, 10);
    await pool.query(
      'INSERT INTO admin_users (username, password_hash) VALUES (?, ?)',
      [ADMIN_USER, hash]
    );
    console.log(`Usuário admin criado: ${ADMIN_USER} / ${ADMIN_PASS}`);
  }
}

// Public Routes
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios'
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }

    if (name.length > 100 || email.length > 100 || message.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Tamanho dos campos excedido'
      });
    }

    // Insert message
    const [result] = await pool.query(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      [name.trim(), email.trim(), message.trim()]
    );

    res.status(201).json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!',
      id: result.insertId
    });
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao enviar mensagem' 
    });
  }
});

// Protected Routes
app.get('/api/messages', authMiddleware, async (req, res) => {
  try {
    const [messages] = await pool.query(
      `SELECT id, name, email, message, 
       DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as created_at
       FROM messages ORDER BY created_at DESC`
    );
    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao buscar mensagens' 
    });
  }
});

app.delete('/api/messages/:id', authMiddleware, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM messages WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mensagem não encontrada' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Mensagem excluída com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao excluir mensagem:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro ao excluir mensagem' 
    });
  }
});

// Server startup
async function startServer() {
  try {
    await setupAdminAuth();
    
    if (process.env.NODE_ENV === 'production') {
      app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
          res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
          next();
        }
      });
    }

    app.listen(PORT, () => {
      console.log(`\nServidor rodando na porta ${PORT}`);
      console.log(`Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Painel admin: http://localhost:${PORT}/admin.html`);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`Credenciais temporárias: ${ADMIN_USER} / ${ADMIN_PASS}`);
        console.log('ATENÇÃO: Altere essas credenciais em produção!');
      }
    });
  } catch (error) {
    console.error('Falha na inicialização:', error);
    process.exit(1);
  }
}

startServer();