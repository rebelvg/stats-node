const express = require('express');

const router = express.Router();

const users = require('../routes/admin/users');
const streamers = require('../routes/admin/streamers');
const isLoggedIn = require('../middleware/is-logged-in');
const isAdmin = require('../middleware/is-admin');

router.use(isLoggedIn);
router.use(isAdmin);
router.use('/users', users);
router.use('/streamers', streamers);

module.exports = router;
