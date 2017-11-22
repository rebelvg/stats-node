const mongoose = require('mongoose');

const schema = require('../schemas/ip');

let IP = mongoose.model('IP', schema);

module.exports = IP;
