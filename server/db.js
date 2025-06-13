const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'palanca_negra_cafe',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Criar tabela de mensagens se não existir
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    await connection.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    connection.release();
    console.log('Banco de dados MySQL conectado e tabela verificada');
  } catch (err) {
    console.error('Erro ao conectar ao MySQL:', err);
    process.exit(1);
  }
}

module.exports = { pool, initializeDatabase };
