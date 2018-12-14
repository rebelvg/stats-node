const express = require('express');

const streamersController = require('../../controllers/admin/streamers');

const router = express.Router();

router.get('/', streamersController.find);

module.exports = router;
