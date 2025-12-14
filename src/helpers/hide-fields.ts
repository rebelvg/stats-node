import _ from 'lodash';

import { shouldHideFields } from './should-hide-fields';
import { IUserModel } from '../models/user';

const paths = [
  ['ip'],
  ['location', 'ip'],
  ['location', 'api', 'query'],
  ['location', 'api', 'city'],
  ['apiResponse', 'ip'],
];

function hideFields(user: IUserModel, obj) {
  if (!shouldHideFields(user)) {
    return;
  }

  _.forEach(paths, (path) => {
    if (_.get(obj, path)) {
      _.set(obj, path, '*');
    }
  });
}

function hideUserData(user: IUserModel, shouldHideIp: boolean) {
  if (shouldHideIp) {
    _.set(user, 'ipCreated', undefined);
    _.set(user, 'ipUpdated', undefined);
  }

  _.set(user, 'googleId', undefined);
  _.set(user, 'token', undefined);
  _.set(user, 'streamKey', undefined);
  _.set(user, 'raw', undefined);

  return user;
}
