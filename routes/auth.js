const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const SECRET = process.env.JWT_SECRET || 'fizlab_secret_change_me';

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    db.run(
        `INSERT INTO users (name, email, password) VALUES (?, ?, ?)`,
        [name, email, hash],
        function(err) {
            if (err) return res.status(400).json({ error: 'Email занят' });
            const token = jwt.sign({ id: this.lastID, role: 'client' }, SECRET);
            res.json({ token, userId: this.lastID });
        }
    );
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Неверные данные' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: 'Неверные данные' });
        const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
        res.json({ token, user: { id: user.id, name: user.name } });
    });
});

module.exports = router;
