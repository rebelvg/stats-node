const _ = require('lodash');

const streamSchema = require('../schemas/stream');
const subscriberSchema = require('../schemas/subscriber');
const ipSchema = require('../schemas/ip');

function hideFields(req, res, next) {
    _.set(streamSchema.options, ['toJSON', 'transform'], function (dec, ret, options) {
        if (!req.user) {
            ret.ip = '*';
        }

        return ret;
    });

    _.set(subscriberSchema.options, ['toJSON', 'transform'], function (dec, ret, options) {
        if (!req.user) {
            ret.ip = '*';
        }

        return ret;
    });

    _.set(ipSchema.options, ['toJSON', 'transform'], function (dec, ret, options) {
        if (!req.user) {
            ret.ip = '*';
            ret.api.query = '*';
        }

        return ret;
    });

    next();
}

module.exports = hideFields;
