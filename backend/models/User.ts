import { UserModel, UserType } from '../db';

export interface UserDoc extends UserType {}

export class User {
  _id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar: string;
  isOnline: boolean;

  constructor(doc: Partial<UserDoc>) {
    this._id = doc._id || '';
    this.username = doc.username || '';
    this.email = doc.email || '';
    this.passwordHash = doc.passwordHash || '';
    this.avatar = doc.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(doc.username || 'default')}`;
    this.isOnline = doc.isOnline !== undefined ? doc.isOnline : false;
  }

  // Mimic password getter/setter
  get password() {
    return this.passwordHash;
  }

  set password(val: string) {
    this.passwordHash = val;
  }

  async save(): Promise<User> {
    if (!this._id) {
      this._id = 'u_' + Math.random().toString(36).substring(2, 11);
    }

    await UserModel.findOneAndUpdate(
      { _id: this._id },
      {
        _id: this._id,
        username: this.username,
        email: this.email,
        passwordHash: this.passwordHash,
        avatar: this.avatar,
        isOnline: this.isOnline,
      },
      { upsert: true, new: true }
    ).exec();

    return this;
  }

  static async findOne(query: Partial<UserDoc>): Promise<User | null> {
    const doc = await UserModel.findOne(query).exec();
    return doc ? new User(doc) : null;
  }

  static async findById(id: string): Promise<User | null> {
    const doc = await UserModel.findOne({ _id: id }).exec();
    return doc ? new User(doc) : null;
  }

  static async findByIdAndUpdate(id: string, update: Partial<UserDoc>): Promise<User | null> {
    const doc = await UserModel.findOneAndUpdate({ _id: id }, { $set: update }, { new: true }).exec();
    return doc ? new User(doc) : null;
  }

  static async find(query?: Partial<UserDoc> & { search?: string }): Promise<User[]> {
    let mongoQuery: any = {};
    if (query) {
      if (query.search) {
        const term = query.search.toLowerCase();
        mongoQuery = {
          $or: [
            { username: { $regex: term, $options: 'i' } },
            { email: { $regex: term, $options: 'i' } },
          ],
        };
      } else {
        const queryTyped = query as Record<string, any>;
        for (const key in queryTyped) {
          if (queryTyped[key] !== undefined) {
            mongoQuery[key] = queryTyped[key];
          }
        }
      }
    }
    const docs = await UserModel.find(mongoQuery).exec();
    return docs.map((doc) => new User(doc));
  }
}
