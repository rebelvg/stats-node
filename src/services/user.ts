import { ObjectId } from 'mongodb';

import { User } from '../models/user';
import { userRepository } from '../repositories/user';
import { IFindStreamers } from './interfaces/user';

class UserService {
  public getById(id: string) {
    return User.findOne({
      _id: new ObjectId(id),
    });
  }

  public async findStreamers(): Promise<IFindStreamers[]> {
    const streamers = await userRepository.find({ isStreamer: true });

    return streamers.map(({ _id, name, streamKey }) => ({
      _id,
      name,
      streamKey,
    }));
  }
}

export const userService = new UserService();
