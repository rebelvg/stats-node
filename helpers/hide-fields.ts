import * as _ from 'lodash';

import { shouldHideFields } from './should-hide-fields';
import { IUserModel } from '../models/user';

const paths = [['ip'], ['location', 'ip'], ['location', 'api', 'query']];

export function hideFields(user: IUserModel, obj) {
  if (!shouldHideFields(user)) {
    return;
  }

  _.forEach(paths, (path) => {
    if (_.get(obj, path)) {
      _.set(obj, path, '*');
    }
  });
}
