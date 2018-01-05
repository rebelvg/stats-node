const mongoose = require('mongoose');
const _ = require('lodash');
const uuidv4 = require('uuid/v4');

const Schema = mongoose.Schema;

let schema = new Schema({
    googleId: {type: String, required: true, unique: true},
    emails: {type: Array, required: true},
    name: {type: String, required: true},
    ipCreated: {type: String, required: true},
    ipUpdated: {type: String, required: true},
    isAdmin: {type: Boolean, required: true},
    isStreamer: {type: Boolean, required: true},
    token: {type: String, required: true, unique: true, index: true},
    streamKey: {type: String, required: true, unique: true, index: true},
    createdAt: {type: Date, required: true, index: true},
    updatedAt: {type: Date, required: true, index: true}
}, {
    retainKeyOrder: true
});

schema.pre('validate', function (next) {
    if (this.isNew) {
        this.isAdmin = false;
        this.isStreamer = false;
        this.token = uuidv4();
        this.streamKey = uuidv4();
    }

    next();
});

schema.pre('validate', function (next) {
    let updatedAt = new Date();

    if (this.isNew) {
        this.createdAt = updatedAt;
    }

    this.updatedAt = updatedAt;

    next();
});

module.exports = schema;
