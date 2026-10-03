const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = require('./db');

app.use('/api/orders', require('./routes/orders'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/auth', require('./routes/auth'));

require('./socket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ FizLab сервер запущен на порту ${PORT}`);
});
