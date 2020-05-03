import * as _ from 'lodash';

export function shouldHideFields(user) {
  return !_.get(user, 'isAdmin', false);
}
