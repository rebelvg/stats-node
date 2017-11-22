const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const _ = require('lodash');
const request = require('request-promise-native');

const Schema = mongoose.Schema;

const apiLink = `http://ip-api.com/json`;

let schema = new Schema({
    ip: {type: String, required: true, unique: true, index: true},
    country: {type: String},
    city: {type: String},
    isp: {type: String},
    createdAt: {type: Date, required: true, index: true},
    updatedAt: {type: Date, required: true, index: true}
}, {
    retainKeyOrder: true
});

schema.pre('validate', async function (next) {
    request.get(`${apiLink}/${this.ip}`, {
        json: true
    })
        .then(res => {
            if (res.status === 'success') {
                this.country = res.country;
                this.city = res.city;
                this.isp = res.isp;
            } else {
                this.country = null;
                this.city = null;
                this.isp = null;
            }

            next();
        })
        .catch(next);
});

schema.pre('validate', function (next) {
    let updatedAt = new Date();

    if (this.isNew) {
        this.createdAt = updatedAt;
    }

    this.updatedAt = updatedAt;

    next();
});

schema.set('toJSON', {virtuals: true});

schema.plugin(mongoosePaginate);

module.exports = schema;
