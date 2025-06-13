import express from 'express';
const app = express();

app.use(express.json());
app.use(express.static('public')); // Coloque seu contato.html dentro da pasta "public"

// Sua rota para receber as mensagens:
app.post('/messages', (req, res) => {
  // lógica para receber e processar dados do formulário...
  res.json({ message: 'Mensagem recebida com sucesso!' });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
