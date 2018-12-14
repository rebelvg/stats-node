const mongoose = require('mongoose');

const schema = require('../schemas/subscriber');

const Subscriber = mongoose.model('Subscriber', schema);

module.exports = Subscriber;
