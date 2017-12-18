const express = require('express');

let router = express.Router();

const users = require('../routes/admin/users');
const isLoggedIn = require('../middleware/isLoggedIn');
const isAdmin = require('../middleware/isAdmin');

router.use(isLoggedIn);
router.use(isAdmin);
router.use('/users', users);

module.exports = router;
