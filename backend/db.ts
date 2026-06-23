import mongoose, { Schema } from 'mongoose';

// 1. User Schema and Interface
export interface UserType {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  isOnline: boolean;
}

const UserSchema = new Schema<UserType>(
  {
    _id: { type: String, default: () => 'u_' + Math.random().toString(36).substring(2, 11) },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    avatar: { type: String, default: '' },
    isOnline: { type: Boolean, default: false },
  },
  { _id: false, timestamps: true }
);

export const UserModel = mongoose.model<UserType>('User', UserSchema);

// 2. Follow Schema and Interface
export interface FollowType {
  _id: string;
  follower: string; // User ID
  following: string; // User ID
}

const FollowSchema = new Schema<FollowType>(
  {
    _id: { type: String, default: () => 'f_' + Math.random().toString(36).substring(2, 11) },
    follower: { type: String, required: true },
    following: { type: String, required: true },
  },
  { _id: false, timestamps: true }
);

export const FollowModel = mongoose.model<FollowType>('Follow', FollowSchema);

// 3. Message Schema and Interface
export interface MessageType {
  _id: string;
  roomId: string; // sorted partner userIds
  sender: string; // sender userId
  text: string;
  timestamp: string;
  expiresAt?: Date | null;
}

const MessageSchema = new Schema<MessageType>(
  {
    _id: { type: String, default: () => 'm_' + Math.random().toString(36).substring(2, 11) },
    roomId: { type: String, required: true },
    sender: { type: String, required: true },
    text: { type: String, required: true },
    timestamp: { type: String, default: () => new Date().toISOString() },
    expiresAt: { type: Date, default: null },
  }
);

export const MessageModel = mongoose.model<MessageType>('Message', MessageSchema);

// 4. Follow Request Schema and Interface
export interface FollowRequestType {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

const FollowRequestSchema = new Schema<FollowRequestType>(
  {
    _id: { type: String, default: () => 'req_' + Math.random().toString(36).substring(2, 11) },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    timestamp: { type: String, default: () => new Date().toISOString() },
  }
);

export const FollowRequestModel = mongoose.model<FollowRequestType>('FollowRequest', FollowRequestSchema);

// 5. Room Setting Schema and Interface
export interface RoomSettingType {
  roomId: string; // sorted partner userIds joined by '_'
  disappearingMode: 'off' | '24h' | '7d';
}

const RoomSettingSchema = new Schema<RoomSettingType>(
  {
    roomId: { type: String, required: true, unique: true },
    disappearingMode: { type: String, enum: ['off', '24h', '7d'], default: 'off' },
  },
  { timestamps: true }
);

export const RoomSettingModel = mongoose.model<RoomSettingType>('RoomSetting', RoomSettingSchema);
