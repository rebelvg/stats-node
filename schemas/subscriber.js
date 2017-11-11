const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const _ = require('lodash');

const Schema = mongoose.Schema;

let schema = new Schema({
    app: {type: String, required: true},
    channel: {type: String, required: true},
    uniqueId: {type: String, required: true},
    timeConnected: {type: Date, required: true, index: true},
    bytes: {type: Number, required: true},
    ip: {type: String, required: true},
    duration: {type: Number, required: true},
    bitrate: {type: Number, required: true},
    createdAt: {type: Date, required: true, index: true},
    updatedAt: {type: Date, required: true, index: true}
}, {
    retainKeyOrder: true
});

schema.pre('validate', function (next) {
    let updatedAt = new Date();

    this.duration = Math.ceil((updatedAt - this.timeConnected) / 1000);

    this.bitrate = this.duration > 0 ? Math.ceil(this.bytes * 8 / this.duration / 1024) : 0;

    if (this.isNew) {
        this.createdAt = updatedAt;
    }

    this.updatedAt = updatedAt;

    next();
});

schema.virtual('isLive').get(function () {
    let subscribers = _.get(global.amsUpdate.live, [this.app, this.channel, 'subscribers'], []);

    return !!_.find(subscribers, ['id', this.id]);
});

schema.set('toJSON', {virtuals: true});

schema.methods.getStream = function (cb) {
    return this.model('Stream').findOne({
        app: this.app,
        channel: this.channel,
        updatedAt: {$gte: this.timeConnected},
        timeConnected: {$lte: this.updatedAt}
    }, cb);
};

schema.plugin(mongoosePaginate);

module.exports = schema;
