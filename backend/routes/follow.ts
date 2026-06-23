import { Router, Response } from 'express';
import { Follow } from '../models/Follow';
import { User } from '../models/User';
import { authMiddleware, AuthenticatedRequest } from './middleware';
import { FollowRequestModel } from '../db';

const router = Router();

// Follow user directly
router.post('/follow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId } = req.body;
  const currentUserId = req.userId!;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required' });
  }

  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: 'You are not allowed to follow yourself' });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user profile not found' });
  }

  try {
    const existing = await Follow.findOne({ follower: currentUserId, following: targetUserId });
    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const follow = new Follow({ follower: currentUserId, following: targetUserId });
    await follow.save();

    return res.json({ success: true, message: 'Follow state saved', isFollowing: true });
  } catch (error) {
    console.error('Follow error:', error);
    return res.status(500).json({ error: 'Follow relation update failed' });
  }
});

// Follow system request sent
router.post('/request', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId } = req.body;
  const currentUserId = req.userId!;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required' });
  }

  if (targetUserId === currentUserId) {
    return res.status(400).json({ error: 'You cannot request to follow yourself' });
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user profile not found' });
  }

  try {
    const existingFollow = await Follow.findOne({ follower: currentUserId, following: targetUserId });
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    const existingRequest = await FollowRequestModel.findOne({
      senderId: currentUserId,
      receiverId: targetUserId,
      status: 'pending',
    }).exec();

    if (existingRequest) {
      return res.status(400).json({ error: 'A follow request is already pending' });
    }

    const newRequest = new FollowRequestModel({
      _id: 'req_' + Math.random().toString(36).substring(2, 11),
      senderId: currentUserId,
      receiverId: targetUserId,
      status: 'pending',
      timestamp: new Date().toISOString(),
    });

    await newRequest.save();

    return res.json({ success: true, message: 'Follow request sent successfully', status: 'pending' });
  } catch (error) {
    console.error('Send follow request error:', error);
    return res.status(500).json({ error: 'Failed to send follow request' });
  }
});

// Get incoming pending follow requests
router.get('/requests/incoming', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.userId!;
  try {
    const pending = await FollowRequestModel.find({
      receiverId: currentUserId,
      status: 'pending',
    }).exec();

    const requestsWithSender = await Promise.all(
      pending.map(async (r) => {
        const sender = await User.findById(r.senderId);
        return {
          _id: r._id,
          senderId: r.senderId,
          timestamp: r.timestamp,
          sender: sender
            ? {
                _id: sender._id,
                username: sender.username,
                avatar: sender.avatar,
              }
            : null,
        };
      })
    );

    const filteredRequests = requestsWithSender.filter((r) => r.sender !== null);

    return res.json({ requests: filteredRequests });
  } catch (error) {
    console.error('Fetch follow requests error:', error);
    return res.status(500).json({ error: 'Failed to retrieve follow requests' });
  }
});

// Accept a follow request
router.post('/requests/accept', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { requestId } = req.body;
  const currentUserId = req.userId!;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  try {
    const reqData = await FollowRequestModel.findOne({
      _id: requestId,
      receiverId: currentUserId,
      status: 'pending',
    }).exec();

    if (!reqData) {
      return res.status(404).json({ error: 'Follow request not found or already processed' });
    }

    // Establish actual follow relation (senderId follows receiverId)
    const existingFollow = await Follow.findOne({ follower: reqData.senderId, following: currentUserId });
    if (!existingFollow) {
      const follow = new Follow({ follower: reqData.senderId, following: currentUserId });
      await follow.save();
    }

    // Clean up or delete after acceptance
    await FollowRequestModel.deleteOne({ _id: requestId }).exec();

    return res.json({ success: true, message: 'Follow request accepted' });
  } catch (error) {
    console.error('Accept request error:', error);
    return res.status(500).json({ error: 'Failed to accept follow request' });
  }
});

// Decline/ignore a follow request
router.post('/requests/decline', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { requestId } = req.body;
  const currentUserId = req.userId!;

  if (!requestId) {
    return res.status(400).json({ error: 'Request ID is required' });
  }

  try {
    const resDel = await FollowRequestModel.deleteOne({
      _id: requestId,
      receiverId: currentUserId,
      status: 'pending',
    }).exec();

    if (resDel.deletedCount === 0) {
      return res.status(404).json({ error: 'Follow request not found or already processed' });
    }

    return res.json({ success: true, message: 'Follow request declined successfully' });
  } catch (error) {
    console.error('Decline request error:', error);
    return res.status(500).json({ error: 'Failed to decline follow request' });
  }
});

// Unfollow user
router.post('/unfollow', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const { targetUserId } = req.body;
  const currentUserId = req.userId!;

  if (!targetUserId) {
    return res.status(400).json({ error: 'Target user ID is required' });
  }

  try {
    // Delete target follow first
    const followResult = await Follow.deleteOne({ follower: currentUserId, following: targetUserId });

    // Also remove any pending follow requests between current user and target user
    const reqDelResult = await FollowRequestModel.deleteMany({
      $or: [
        { senderId: currentUserId, receiverId: targetUserId },
        { senderId: targetUserId, receiverId: currentUserId },
      ],
    }).exec();

    const requestsDeleted = reqDelResult.deletedCount || 0;

    if (followResult.deletedCount === 0 && requestsDeleted === 0) {
      return res.status(400).json({ error: 'No relationship or request exists with this user' });
    }

    return res.json({ success: true, message: 'Relationship or request updated', isFollowing: false });
  } catch (error) {
    console.error('Unfollow error:', error);
    return res.status(500).json({ error: 'Unfollow operation failed' });
  }
});

export default router;
