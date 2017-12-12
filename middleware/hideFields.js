const _ = require('lodash');

const streamSchema = require('../schemas/stream');
const subscriberSchema = require('../schemas/subscriber');

function hideFields(req, res, next) {
    _.set(streamSchema.options, ['toJSON', 'transform'], function (dec, ret, options) {
        if (!req.user) {
            delete ret.ip;
            delete ret.location;
        }

        return ret;
    });

    _.set(subscriberSchema.options, ['toJSON', 'transform'], function (dec, ret, options) {
        if (!req.user) {
            delete ret.ip;
            delete ret.location;
        }

        return ret;
    });

    next();
}

module.exports = hideFields;
