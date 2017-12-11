const mongoose = require('mongoose');

const schema = require('../schemas/user');

let User = mongoose.model('User', schema);

module.exports = User;
