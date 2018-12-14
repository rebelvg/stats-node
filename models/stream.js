const mongoose = require('mongoose');

const schema = require('../schemas/stream');

const Stream = mongoose.model('Stream', schema);

module.exports = Stream;
