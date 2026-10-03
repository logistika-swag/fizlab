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

// ===== ЗАЩИТА АДМИНКИ ПАРОЛЕМ =====
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme123';

// Middleware проверки пароля (Basic Auth)
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Basic ')) {
        res.set('WWW-Authenticate', 'Basic realm="FizLab Admin"');
        return res.status(401).send('Требуется авторизация');
    }

    const decoded = Buffer.from(auth.split(' ')[1], 'base64').toString();
    const [login, password] = decoded.split(':');

    if (password === ADMIN_PASSWORD) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="FizLab Admin"');
    return res.status(401).send('Неверный пароль');
}

// ===== ЗАЩИЩАЕМ АДМИНКУ =====
app.get('/admin.html', requireAdmin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Защищаем API для админа (получение и изменение заказов)
app.use('/api/orders', (req, res, next) => {
    // POST (создание заказа) — доступно всем (клиенты)
    if (req.method === 'POST' && req.path === '/') return next();
    // GET /stats/summary — доступно всем (для главной страницы)
    if (req.path === '/stats/summary' && req.method === 'GET') return next();
    // Всё остальное (список всех заказов, изменение статуса) — только админ
    return requireAdmin(req, res, next);
});

// Статика (клиентский сайт)
app.use(express.static(path.join(__dirname, 'public'), { index: 'index.html' }));

// API маршруты
app.use('/api/orders', require('./routes/orders'));
app.use('/api/push', require('./routes/push'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/auth', require('./routes/auth'));

// Socket.IO
require('./socket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ FizLab сервер запущен на порту ${PORT}`);
});
