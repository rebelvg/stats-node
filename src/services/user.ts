import { ObjectId } from 'mongodb';

import { IUserModel, User } from '../models/user';
import { userRepository } from '../repositories/user';
import { IFindStreamers } from './interfaces/user';

class UserService {
  public getById(id: string) {
    if (!id) {
      return null;
    }

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

  public async getMapByIds(
    userIds: string[],
  ): Promise<Record<string, IUserModel>> {
    const userRecords = await User.find({
      _id: {
        $in: userIds,
      },
    });

    const userMap: Record<string, IUserModel> = {};

    for (const userRecord of userRecords) {
      userMap[userRecord._id?.toString()] = userRecord;
    }

    return userMap;
  }
}

export const userService = new UserService();
