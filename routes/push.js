const express = require('express');
const router = express.Router();
const push = require('../push');

router.get('/vapid-public-key', (req, res) => {
    res.json({ key: push.VAPID_PUBLIC });
});

router.post('/subscribe', async (req, res) => {
    const { orderId, subscription } = req.body;
    if (!orderId || !subscription) return res.status(400).json({ error: 'Нужны orderId и subscription' });
    try {
        await push.saveSubscription(orderId, subscription);
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;
