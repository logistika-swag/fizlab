const db = require('./db');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('🔌 Клиент подключен:', socket.id);

        socket.on('join_order', (orderId) => {
            socket.join(`order_${orderId}`);
        });

        socket.on('message', ({ orderId, sender, text }) => {
            db.run(
                `INSERT INTO messages (order_id, sender, text) VALUES (?, ?, ?)`,
                [orderId, sender, text],
                function(err) {
                    if (err) return console.error(err);
                    io.to(`order_${orderId}`).emit('message', {
                        id: this.lastID,
                        orderId,
                        sender,
                        text,
                        created_at: new Date()
                    });
                }
            );
        });

        socket.on('disconnect', () => {
            console.log('❌ Клиент отключен:', socket.id);
        });
    });
};
