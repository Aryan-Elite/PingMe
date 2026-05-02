const jwt = require('jsonwebtoken');

const setupNotifications = (io) => {
  const notifNS = io.of('/notifications'); // /notifications namespace — per-user alert channel

  // middleware: verify JWT before allowing connection
  notifNS.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  notifNS.on('connection', (socket) => {
    const userId = socket.user.userId;
    console.log('User connected to notifications:', userId);

    // join personal room using userId — so server can target this user specifically
    socket.join(userId);

    socket.on('disconnect', () => {
      console.log('User disconnected from notifications:', userId);
    });
  });
};

module.exports = setupNotifications;
