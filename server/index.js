const express = require('express');
const path = require('path');
const messagesRouter = require('./messages');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Rotas da API
app.use('/api/messages', messagesRouter);

// Rotas para páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/sobre', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/sobre.html'));
});

app.get('/cardapio', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/cardapio.html'));
});

app.get('/contato', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/contato.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});