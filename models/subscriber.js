const mongoose = require('mongoose');

const schema = require('../schemas/subscriber');

let Subscriber = mongoose.model('Subscriber', schema);

module.exports = Subscriber;
