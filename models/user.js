const mongoose = require('mongoose');

const schema = require('../schemas/user');

const User = mongoose.model('User', schema);

module.exports = User;
