const _ = require('lodash');

const User = require('../../models/user');

function find(req, res, next) {
    User.find()
        .then(users => {
            res.json({
                users: users
            });
        })
        .catch(next);
}

exports.find = find;
