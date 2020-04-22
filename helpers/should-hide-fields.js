const _ = require('lodash');

function shouldHideFields(user) {
  return !_.get(user, 'isAdmin', false);
}

module.exports = shouldHideFields;
