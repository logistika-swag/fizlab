const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:orderId', (req, res) => {
    db.all(
        `SELECT * FROM messages WHERE order_id = $1 ORDER BY created_at ASC`,
        [req.params.orderId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(rows);
        }
    );
});

module.exports = router;
