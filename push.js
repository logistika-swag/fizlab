const webpush = require('web-push');
const db = require('./db');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@fizlab.com';

if (VAPID_PUBLIC && VAPID_PRIVATE) {
    webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
    console.log('✅ Push-уведомления активированы');
} else {
    console.warn('⚠️ VAPID ключи не заданы — push-уведомления отключены');
}

function saveSubscription(orderId, subscription) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO push_subscriptions (order_id, subscription) VALUES (?, ?)`,
            [orderId, JSON.stringify(subscription)],
            function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            }
        );
    });
}

async function sendPushToOrder(orderId, payload) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
    db.all(
        `SELECT * FROM push_subscriptions WHERE order_id = ?`,
        [orderId],
        async (err, rows) => {
            if (err || !rows) return;
            for (const row of rows) {
                try {
                    const sub = JSON.parse(row.subscription);
                    await webpush.sendNotification(sub, JSON.stringify(payload));
                } catch (e) {
                    console.error('Push error:', e.statusCode || e.message);
                    if (e.statusCode === 410 || e.statusCode === 404) {
                        db.run('DELETE FROM push_subscriptions WHERE id = ?', [row.id]);
                    }
                }
            }
        }
    );
}

async function sendPushToAll(payload) {
    if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
    db.all(`SELECT * FROM push_subscriptions`, [], async (err, rows) => {
        if (err || !rows) return;
        for (const row of rows) {
            try {
                const sub = JSON.parse(row.subscription);
                await webpush.sendNotification(sub, JSON.stringify(payload));
            } catch (e) {
                if (e.statusCode === 410 || e.statusCode === 404) {
                    db.run('DELETE FROM push_subscriptions WHERE id = ?', [row.id]);
                }
            }
        }
    });
}

module.exports = {
    saveSubscription,
    sendPushToOrder,
    sendPushToAll,
    VAPID_PUBLIC
};
