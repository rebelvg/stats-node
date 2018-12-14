const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');
const request = require('request-promise-native');

const Schema = mongoose.Schema;

const apiLink = `http://ip-api.com/json/`;

const schema = new Schema(
  {
    ip: { type: String, required: true, unique: true, index: true },
    api: { type: Object, required: true },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true }
  },
  {
    retainKeyOrder: true
  }
);

schema.pre('validate', function(next) {
  request
    .get(apiLink + this.ip, {
      json: true
    })
    .then(res => {
      this.api = res;

      next();
    })
    .catch(next);
});

schema.pre('validate', function(next) {
  const updatedAt = new Date();

  if (this.isNew) {
    this.createdAt = updatedAt;
  }

  this.updatedAt = updatedAt;

  next();
});

schema.set('toJSON', { virtuals: true });

schema.plugin(mongoosePaginate);

module.exports = schema;
