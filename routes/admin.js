const express = require('express');

let router = express.Router();

const users = require('../routes/admin/users');
const streamers = require('../routes/admin/streamers');
const isLoggedIn = require('../middleware/isLoggedIn');
const isAdmin = require('../middleware/isAdmin');

router.use(isLoggedIn);
router.use(isAdmin);
router.use('/users', users);
router.use('/streamers', streamers);

module.exports = router;
