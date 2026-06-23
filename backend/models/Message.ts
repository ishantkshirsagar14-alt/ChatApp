import { MessageModel, MessageType } from '../db';

export interface MessageDoc extends MessageType {}

export class Message {
  _id: string;
  roomId: string;
  sender: string; // User ID
  text: string;
  timestamp: string;
  expiresAt?: Date | null;

  constructor(doc: Partial<MessageDoc>) {
    this._id = doc._id || '';
    this.roomId = doc.roomId || '';
    this.sender = doc.sender || '';
    this.text = doc.text || '';
    this.timestamp = doc.timestamp || new Date().toISOString();
    this.expiresAt = doc.expiresAt !== undefined ? doc.expiresAt : null;
  }

  async save(): Promise<Message> {
    if (!this._id) {
      this._id = 'm_' + Math.random().toString(36).substring(2, 11);
    }

    await MessageModel.findOneAndUpdate(
      { _id: this._id },
      {
        _id: this._id,
        roomId: this.roomId,
        sender: this.sender,
        text: this.text,
        timestamp: this.timestamp,
        expiresAt: this.expiresAt,
      },
      { upsert: true, new: true }
    ).exec();

    return this;
  }

  static async find(query: Partial<MessageDoc>): Promise<Message[]> {
    const docs = await MessageModel.find(query).lean().exec();
    return docs.map((doc) => new Message(doc));
  }
}
