import { FollowModel, FollowType } from '../db';

export interface FollowDoc extends FollowType {}

export class Follow {
  _id: string;
  follower: string; // User ID of follower
  following: string; // User ID of user being followed

  constructor(doc: Partial<FollowDoc>) {
    this._id = doc._id || '';
    this.follower = doc.follower || '';
    this.following = doc.following || '';
  }

  async save(): Promise<Follow> {
    if (!this._id) {
      this._id = 'f_' + Math.random().toString(36).substring(2, 11);
    }

    await FollowModel.findOneAndUpdate(
      { _id: this._id },
      {
        _id: this._id,
        follower: this.follower,
        following: this.following,
      },
      { upsert: true, new: true }
    ).exec();

    return this;
  }

  static async findOne(query: Partial<FollowDoc>): Promise<Follow | null> {
    const doc = await FollowModel.findOne(query).exec();
    return doc ? new Follow(doc) : null;
  }

  static async find(query: Partial<FollowDoc>): Promise<Follow[]> {
    const docs = await FollowModel.find(query).exec();
    return docs.map((doc) => new Follow(doc));
  }

  static async deleteOne(query: Partial<FollowDoc>): Promise<{ deletedCount: number }> {
    const res = await FollowModel.deleteOne(query).exec();
    return { deletedCount: res.deletedCount || 0 };
  }
}
