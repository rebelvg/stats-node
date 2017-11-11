const mongoose = require('mongoose');

const schema = require('../schemas/stream');

let Stream = mongoose.model('Stream', schema);

module.exports = Stream;
