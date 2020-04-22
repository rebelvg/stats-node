const _ = require('lodash');

const shouldHideFields = require('./should-hide-fields');

const paths = [['ip'], ['location', 'ip'], ['location', 'api', 'query']];

function hideFields(user, obj) {
  if (!shouldHideFields(user)) {
    return;
  }

  _.forEach(paths, path => {
    if (_.get(obj, path)) {
      _.set(obj, path, '*');
    }
  });
}

module.exports = hideFields;
