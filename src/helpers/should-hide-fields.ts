import _ from 'lodash';

import { IUserModel } from '../models/user';

export function shouldHideFields(user: IUserModel | null): boolean {
  if (!user) {
    return true;
  }

  if (!user.isAdmin) {
    return true;
  }

  return false;
}
