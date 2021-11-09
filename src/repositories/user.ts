import { FilterQuery } from 'mongoose';
import { IUserModel, User } from '../models/user';

class UserRepository {
  public async find(params: FilterQuery<IUserModel>): Promise<IUserModel[]> {
    const streamers = await User.find(params);

    return streamers;
  }
}

export const userRepository = new UserRepository();
