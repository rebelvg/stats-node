const express = require('express');

const streamersController = require('../../controllers/admin/streamers');
const isLoggedIn = require('../../middleware/isLoggedIn');

let router = express.Router();

router.get('/', streamersController.find);

module.exports = router;
