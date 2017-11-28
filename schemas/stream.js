const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const _ = require('lodash');
const ip6addr = require('ip6addr');

const IP = require('../models/ip');

const Schema = mongoose.Schema;

let schema = new Schema({
    app: {type: String, required: true},
    channel: {type: String, required: true},
    serverType: {type: String, required: true},
    serverId: {type: String, required: true},
    connectCreated: {type: Date, required: true, index: true},
    connectUpdated: {type: Date, required: true, index: true},
    bytes: {type: Number, required: true},
    ip: {type: String, required: true},
    protocol: {type: String, required: true},
    duration: {type: Number, required: true},
    bitrate: {type: Number, required: true},
    totalConnectionsCount: {type: Number, required: true},
    peakViewersCount: {type: Number, required: true},
    createdAt: {type: Date, required: true, index: true},
    updatedAt: {type: Date, required: true, index: true}
}, {
    retainKeyOrder: true
});

schema.pre('validate', function (next) {
    let updatedAt = new Date();

    if (this.isNew) {
        let addr = ip6addr.parse(this.ip);

        this.ip = addr.kind() === 'ipv6' ? addr.toString({format: 'v6'}) : addr.toString({format: 'v4'});
    }

    this.duration = Math.ceil((this.connectUpdated - this.connectCreated) / 1000);

    this.bitrate = this.duration > 0 ? Math.ceil(this.bytes * 8 / this.duration / 1024) : 0;

    if (this.isNew) {
        this.totalConnectionsCount = 0;
        this.peakViewersCount = 0;

        this.createdAt = updatedAt;
    }

    this.updatedAt = updatedAt;

    next();
});

schema.pre('save', function (next) {
    if (this.isNew) {
        let ip = IP.findOne({ip: this.ip}, (err, ip) => {
            if (err) return console.log(err.message);
            if (ip) return;

            ip = new IP({ip: this.ip});

            ip.save(function (err) {
                if (err) return console.log(err.message);
            });
        });
    }

    next();
});

schema.virtual('isLive').get(function () {
    let stream = _.get(global.liveStats, [this.serverType, this.app, this.channel, 'publisher'], null);

    if (!stream) {
        return false;
    }

    return stream.id === this.id;
});

schema.virtual('location', {
    ref: 'IP',
    localField: 'ip',
    foreignField: 'ip',
    justOne: true
});

schema.set('toJSON', {virtuals: true});

schema.methods.getSubscribers = function (query = {}) {
    query = {
        $and: [
            {
                app: this.app,
                channel: this.channel,
                serverType: this.serverType,
                connectUpdated: {$gte: this.connectCreated},
                connectCreated: {$lte: this.connectUpdated}
            },
            query
        ]
    };

    return this.model('Subscriber').find(query);
};

schema.methods.getRelatedStreams = function (query = {}) {
    query = {
        $and: [
            {
                _id: {$ne: this._id},
                channel: this.channel,
                serverType: this.serverType,
                connectUpdated: {$gte: this.connectCreated},
                connectCreated: {$lte: this.connectUpdated}
            },
            query
        ]
    };

    return this.model('Stream').find(query);
};

schema.methods.updateInfo = async function () {
    let subscribers = await this.getSubscribers();

    this.totalConnectionsCount = subscribers.length;

    function filterSubscribers(time, include = false) {
        let compareFnc = include ? _.gte : _.gt;

        return _.filter(subscribers, (subscriber) => {
            return compareFnc(subscriber.connectUpdated, time)
                && _.gte(time, subscriber.connectCreated);
        }).map((subscriber) => {
            return subscriber._id;
        });
    }

    _.forEach(subscribers, (subscriber) => {
        let viewersCount = filterSubscribers(subscriber.connectCreated).length;

        if (viewersCount > this.peakViewersCount) this.peakViewersCount = viewersCount;
    });
};

schema.plugin(mongoosePaginate);

module.exports = schema;
