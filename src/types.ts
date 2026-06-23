export interface User {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  isOnline: boolean;
  isFollowing?: boolean;
  hasPendingRequest?: boolean;
}

export interface Message {
  _id: string;
  roomId: string;
  sender: string; // user ID of sender
  text: string;
  timestamp: string;
  expiresAt?: string | null;
  pending?: boolean;
}

export interface Follow {
  _id: string;
  follower: string;
  following: string;
}

export interface FollowRequest {
  _id: string;
  senderId: string;
  timestamp: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
}
