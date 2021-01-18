import { IUserModel, User } from '../models/user';

class UserRepository {
  public async find(params: Partial<IUserModel>): Promise<IUserModel[]> {
    const streamers = await User.find(params);

    return streamers;
  }
}

export const userRepository = new UserRepository();
