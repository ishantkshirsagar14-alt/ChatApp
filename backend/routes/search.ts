import { Router, Response } from 'express';
import { User } from '../models/User';
import { Follow } from '../models/Follow';
import { authMiddleware, AuthenticatedRequest } from './middleware';
import { FollowRequestModel } from '../db';

const router = Router();

router.get('/', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  const queryTerm = (req.query.query as string) || '';
  const currentUserId = req.userId!;

  try {
    const allUsers = await User.find();
    // Exclude the current logged-in user and filter matching name criteria
    const matches = allUsers.filter(
      (u) =>
        u._id !== currentUserId &&
        u.username.toLowerCase().includes(queryTerm.toLowerCase())
    );

    const userCards = await Promise.all(
      matches.map(async (user) => {
        const isFollowingDoc = await Follow.findOne({
          follower: currentUserId,
          following: user._id,
        });
        const isFollowing = isFollowingDoc !== null;

        const hasPendingRequestDoc = await FollowRequestModel.findOne({
          senderId: currentUserId,
          receiverId: user._id,
          status: 'pending',
        }).exec();
        const hasPendingRequest = hasPendingRequestDoc !== null;

        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          isOnline: user.isOnline,
          isFollowing,
          hasPendingRequest,
        };
      })
    );

    return res.json({ users: userCards });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'User search operation failed' });
  }
});

export default router;
