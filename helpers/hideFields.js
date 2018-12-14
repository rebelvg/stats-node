const _ = require('lodash');

const paths = [['ip'], ['location', 'ip'], ['location', 'api', 'query']];

function hideFields(obj) {
  _.forEach(paths, path => {
    if (_.get(obj, path)) {_.set(obj, path, '*');}
  });
}

module.exports = hideFields;
