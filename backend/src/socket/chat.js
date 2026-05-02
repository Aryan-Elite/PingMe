const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

const setupChat=(io) => {
  const chatNS = io.of('/chat'); // /chat namespace — isolated channel for messaging

  // middleware: verify JWT before allowing connection
  chatNS.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = decoded; // attach user to socket so all handlers know who this is
      next();
    } catch (err) {
      next(new Error('Unauthorized'));
    }
  });

  chatNS.on('connection', (socket) => {
    console.log('User connected to chat:', socket.user.userId);

    // client emits 'join' with roomId → socket joins that room
    socket.on('join', (roomId) => {
      socket.join(roomId);
    });

    // client emits 'message' → save to DB → broadcast to room (excluding sender)
    socket.on('message', async (data) => {
      const { roomId, content } = data;
      const message = await Message.create({
        roomId,
        senderId: socket.user.userId,
        content
      });
      socket.to(roomId).emit('message', {
        messageId: message._id,
        senderId: socket.user.userId,
        content,
        createdAt: message.createdAt
      });
    });

    // client emits 'typing' → broadcast to room so others see typing indicator
    socket.on('typing', (roomId) => {
      socket.to(roomId).emit('typing', { userId: socket.user.userId });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.user.userId);
    });
  });
};

module.exports=setupChat;