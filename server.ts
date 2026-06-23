import 'dotenv/config';
import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

// Routes
import authRoutes from './backend/routes/auth';
import searchRoutes from './backend/routes/search';
import followRoutes from './backend/routes/follow';
import chatRoutes from './backend/routes/chat';

// Models for Socket management
import { User } from './backend/models/User';
import { Message } from './backend/models/Message';
import { MessageModel, RoomSettingModel } from './backend/db';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Configuration for MONGODB_URI
  const MONGODB_URI = process.env.MONGODB_URI || '';

  if (!MONGODB_URI || MONGODB_URI.includes('<db_username>') || MONGODB_URI.includes('<db_password>')) {
    console.warn(
      "⚠️ [MONGO_WARN] MONGODB_URI contains unresolved '<db_username>' or placeholder values. Please update MONGODB_URI with real credentials."
    );
  }

  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ [MONGO] Successfully connected to MongoDB Atlas.');
    } catch (err) {
      console.error('❌ [MONGO_ERROR] Failed to establish MongoDB Atlas connection:', err);
    }
  } else {
    console.warn('⚠️ [MONGO_WARN] MONGODB_URI is not set. Database operations will fail.');
  }

  // CORS and body parser
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/follow', followRoutes);
  app.use('/api/chat', chatRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date() });
  });

  // Setup Socket.io Server
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track socket connections to active users
  const socketToUser = new Map<string, string>(); // socketId -> userId

  io.on('connection', (socket) => {
    // 1. User logs in/registers and connects, or opens app
    socket.on('setup', async (data: { userId: string }) => {
      const { userId } = data;
      if (!userId) return;

      socketToUser.set(socket.id, userId);

      try {
        // Update DB to online
        await User.findByIdAndUpdate(userId, { isOnline: true });
      } catch (err) {
        console.error('Error updating user presence on setup:', err);
      }

      // Personal notification room
      socket.join(userId);

      // Broadcast to all that this user is online
      io.emit('user_presence', { userId, isOnline: true });
      console.log(`User ${userId} setup connected. Socket: ${socket.id}`);
    });

    // 2. Joining physical Chat Room Isolation
    socket.on('join_room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined Chat Room: ${roomId}`);
    });

    // 3. Handing message broadcast inside room
    socket.on('send_message', async (data: { roomId: string; senderId: string; text: string }) => {
      const { roomId, senderId, text } = data;
      if (!roomId || !senderId || !text) return;

      try {
        // Fetch current room settings for disappearing mode
        const roomSetting = await RoomSettingModel.findOne({ roomId }).lean().exec();
        
        let expiresAt: Date | null = null;
        if (roomSetting?.disappearingMode === '24h') {
          expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        } else if (roomSetting?.disappearingMode === '7d') {
          expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        }

        const newMessage = new Message({
          roomId,
          sender: senderId,
          text,
          timestamp: new Date().toISOString(),
          expiresAt,
        });
        await newMessage.save();

        // Broadcast to room
        io.to(roomId).emit('message_received', {
          _id: newMessage._id,
          roomId: newMessage.roomId,
          sender: newMessage.sender,
          text: newMessage.text,
          timestamp: newMessage.timestamp,
          expiresAt: newMessage.expiresAt ? newMessage.expiresAt.toISOString() : null,
        });

        // Also broadcast notification to other individual user channel for push trigger/sidebar notification update
        const userIds = roomId.split('_');
        const recipientUserId = userIds.find((id) => id !== senderId);
        if (recipientUserId) {
          io.to(recipientUserId).emit('message_alert', {
            roomId,
            senderId,
            text,
          });
        }
      } catch (err) {
        console.error('Socket message save failed:', err);
      }
    });

    // 3.5. Handing disappearing messages setting updates
    socket.on('change_disappearing_mode', async (data: { roomId: string; disappearingMode: 'off' | '24h' | '7d' }) => {
      const { roomId, disappearingMode } = data;
      if (!roomId || !disappearingMode) return;
      try {
        await RoomSettingModel.findOneAndUpdate(
          { roomId },
          { $set: { disappearingMode } },
          { upsert: true, new: true }
        ).exec();
        
        io.to(roomId).emit('disappearing_mode_changed', { roomId, disappearingMode });
      } catch (err) {
        console.error('Socket change disappearing mode failed:', err);
      }
    });

    // 4. Socket Disconnect Presence Clean
    socket.on('disconnect', async () => {
      const userId = socketToUser.get(socket.id);
      if (userId) {
        socketToUser.delete(socket.id);

        // Check if user has any other active connections
        const activeSocketsForUser = Array.from(socketToUser.values()).filter((uId) => uId === userId);

        if (activeSocketsForUser.length === 0) {
          try {
            // No more active sockets, update presence to false
            await User.findByIdAndUpdate(userId, { isOnline: false });
            io.emit('user_presence', { userId, isOnline: false });
            console.log(`User ${userId} disconnected. Now offline.`);
          } catch (err) {
            console.error('Error updating presence on disconnect:', err);
          }
        } else {
          console.log(`User ${userId} disconnected one socket connection. Still active elsewhere.`);
        }
      }
    });
  });

  // Vite Integration for development / production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Expiry check cleanup job
  async function cleanupExpiredMessages() {
    try {
      const now = new Date();
      const result = await MessageModel.deleteMany({
        expiresAt: { $ne: null, $lte: now }
      }).exec();
      if (result.deletedCount && result.deletedCount > 0) {
        console.log(`🧹 [CLEANUP] Automatically purged ${result.deletedCount} expired disappearing messages.`);
      }
    } catch (err) {
      console.error('❌ [CLEANUP_ERROR] Failed to run expired messages cleanup job:', err);
    }
  }

  // Run cleanup on startup and then every hour
  cleanupExpiredMessages();
  setInterval(cleanupExpiredMessages, 60 * 60 * 1000);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[IKCHATMEET_SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error('Fatal crash on server start:', e);
});
