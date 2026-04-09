import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      socket.userId = null;
      socket.userRole = null;
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      socket.userId = null;
      socket.userRole = null;
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('join:issue', (issueId) => {
      socket.join(`issue:${issueId}`);
    });

    socket.on('leave:issue', (issueId) => {
      socket.leave(`issue:${issueId}`);
    });

    socket.on('join:admin', () => {
      if (socket.userRole === 'ADMIN' || socket.userRole === 'OFFICIAL') {
        socket.join('admin');
      }
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
}
