import * as _ from 'lodash';

import { IUserModel } from '../models/user';

export function shouldHideFields(user: IUserModel) {
  return !user?.isAdmin || true;
}
