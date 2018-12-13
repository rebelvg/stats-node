const _ = require('lodash');

function filterSubscribers(subscribers, time, include = false) {
  let compareFnc = include ? _.gte : _.gt;

  return _.filter(subscribers, subscriber => {
    return compareFnc(subscriber.connectUpdated, time) && _.gte(time, subscriber.connectCreated);
  }).map(subscriber => {
    return subscriber._id;
  });
}

module.exports = filterSubscribers;
