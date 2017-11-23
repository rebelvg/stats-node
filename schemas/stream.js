const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const _ = require('lodash');

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
    viewersCount: {type: Number, required: true},
    createdAt: {type: Date, required: true, index: true},
    updatedAt: {type: Date, required: true, index: true}
}, {
    retainKeyOrder: true
});

schema.pre('validate', function (next) {
    let updatedAt = new Date();

    this.duration = Math.ceil((this.connectUpdated - this.connectCreated) / 1000);

    this.bitrate = this.duration > 0 ? Math.ceil(this.bytes * 8 / this.duration / 1024) : 0;

    if (this.isNew) {
        this.viewersCount = 0;

        this.createdAt = updatedAt;
    }

    this.updatedAt = updatedAt;

    next();
});

schema.pre('save', function (next) {
    if (this.isNew) {
        let ip = new IP({
            ip: this.ip
        });

        ip.save(function (err) {
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

schema.set('toJSON', {virtuals: true});

schema.methods.getSubscribers = function (cb) {
    return this.model('Subscriber').find({
        app: this.app,
        channel: this.channel,
        connectUpdated: {$gte: this.connectCreated},
        connectCreated: {$lte: this.connectUpdated}
    }, cb);
};

schema.methods.countSubscribers = function (cb) {
    return this.model('Subscriber').count({
        app: this.app,
        channel: this.channel,
        connectUpdated: {$gte: this.connectCreated},
        connectCreated: {$lte: this.connectUpdated}
    }, cb);
};

schema.plugin(mongoosePaginate);

module.exports = schema;
