import { Router, Response } from 'express';
import { Follow } from '../models/Follow';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { authMiddleware, AuthenticatedRequest } from './middleware';
import { RoomSettingModel } from '../db';

const router = Router();

// Get list of followed users for the chat contact list
router.get('/users', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.userId!;

  try {
    const follows = await Follow.find({ follower: currentUserId });
    const followedUsersWithNulls = await Promise.all(
      follows.map(async (f) => {
        const user = await User.findById(f.following);
        if (!user) return null;
        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          isOnline: user.isOnline,
        };
      })
    );

    const followedUsers = followedUsersWithNulls.filter((u) => u !== null);

    return res.json({ users: followedUsers });
  } catch (error) {
    console.error('Error fetching followed users:', error);
    return res.status(500).json({ error: 'Failed to fetch active chat contacts' });
  }
});

// Get message logs. Room ID is calculated as sorted user IDs joined by an underscore
router.get('/messages/:roomId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const currentUserId = req.userId!;

  // Security guard check: Ensure current user is one of the parties inside this roomId
  const userIds = roomId.split('_');
  if (!userIds.includes(currentUserId)) {
    return res.status(403).json({ error: 'Access denied: You are not a regular participant of this chat room.' });
  }

  try {
    const messages = await Message.find({ roomId });
    // Ensure ascending chronological timestamp sort order
    messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ error: 'Failed to retrieve chat message history' });
  }
});

// Get Room Setting for Disappearing Messages
router.get('/settings/:roomId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  try {
    const doc = await RoomSettingModel.findOne({ roomId }).lean().exec();
    return res.json({ disappearingMode: doc?.disappearingMode || 'off' });
  } catch (error) {
    console.error('Error fetching room settings:', error);
    return res.status(500).json({ error: 'Failed to fetch room settings' });
  }
});

// Update Room Setting for Disappearing Messages
router.post('/settings/:roomId', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  const { disappearingMode } = req.body;

  if (!disappearingMode || !['off', '24h', '7d'].includes(disappearingMode)) {
    return res.status(400).json({ error: 'Invalid disappearingMode' });
  }

  try {
    await RoomSettingModel.findOneAndUpdate(
      { roomId },
      { $set: { disappearingMode } },
      { upsert: true, new: true }
    ).exec();

    return res.json({ success: true, disappearingMode });
  } catch (error) {
    console.error('Error updating room settings:', error);
    return res.status(500).json({ error: 'Failed to save room settings' });
  }
});

export default router;
