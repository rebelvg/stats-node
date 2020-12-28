import { ObjectId } from 'mongodb';

import { User } from '../models/user';

class UserService {
  public getById(id: string) {
    return User.findOne({
      _id: new ObjectId(id),
    });
  }
}

export const userService = new UserService();
