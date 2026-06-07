const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Connection = require('../models/Connection');


function setupSocket(httpServer, app) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:8000',
      credentials: true,
    },
  });


  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication error'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket] User ${userId} connected (${socket.id})`);


    socket.join(`user_${userId}`);

    socket.on('join_conversation', async ({ conversationId }) => {
      try {
        const isMember = await Message.isMember(conversationId, userId);
        if (!isMember) return socket.emit('error', { message: 'Không có quyền truy cập' });

        socket.join(`conv_${conversationId}`);

        await Message.markAllRead(conversationId, userId);

        socket.to(`conv_${conversationId}`).emit('messages_read', {
          conversationId,
          by: userId,
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('leave_conversation', ({ conversationId }) => {
      socket.leave(`conv_${conversationId}`);
    });


    socket.on('send_message', async ({ conversationId, content }) => {
      try {
        if (!content?.trim()) return;

        const isMember = await Message.isMember(conversationId, userId);
        if (!isMember) return socket.emit('error', { message: 'Không có quyền truy cập' });

        const msg = await Message.send(conversationId, userId, content.trim());

        io.to(`conv_${conversationId}`).emit('new_message', msg);

        const db = require('../config/database');
        const [[conv]] = await db.execute(
          `SELECT user1_id, user2_id FROM conversations WHERE id = ?`,
          [conversationId]
        );
        if (conv) {
          const partnerId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
          const partnerSockets = await io.in(`user_${partnerId}`).fetchSockets();
          const partnerInRoom = partnerSockets.some(s => s.rooms.has(`conv_${conversationId}`));

          // Luôn emit để sidebar cập nhật tin nhắn mới nhất
          io.to(`user_${partnerId}`).emit('conversation_updated', {
            conversationId,
            senderId: userId,
            senderName: socket.user.fullName,
            preview: content.trim().slice(0, 60),
            lastMessage: msg,
          });

          // Chỉ emit notification khi partner không đang trong room đó
          if (!partnerInRoom) {
            io.to(`user_${partnerId}`).emit('notification_message', {
              conversationId,
              senderId: userId,
              senderName: socket.user.fullName,
              preview: content.trim().slice(0, 60),
            });
          }
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('user_typing', {
        conversationId,
        userId,
        userName: socket.user.fullName,
      });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(`conv_${conversationId}`).emit('user_stop_typing', {
        conversationId,
        userId,
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] User ${userId} disconnected`);
    });
  });

  app.set('io', io);

  return io;
}

module.exports = setupSocket;