const mongoose = require('mongoose');
const _ = require('lodash');

const Schema = mongoose.Schema;

let schema = new Schema({
    googleId: {type: String, required: true, unique: true},
    emails: {type: Array, required: true},
    name: {type: String, required: true},
    ipCreated: {type: String, required: true},
    ipUpdated: {type: String, required: true},
    isAdmin: {type: Boolean, required: true},
    createdAt: {type: Date, required: true, index: true},
    updatedAt: {type: Date, required: true, index: true}
}, {
    retainKeyOrder: true
});

schema.pre('validate', function (next) {
    if (this.isNew) {
        this.isAdmin = false;
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
