const mongoose = require('mongoose');

const schema = require('../schemas/ip');

const IP = mongoose.model('IP', schema);

module.exports = IP;
