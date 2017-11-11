const express = require('express');

const channelController = require('../controllers/channels');

let router = express.Router();

router.get('/:app/:channel', channelController.appChannelStats);
router.get('/:channel', channelController.channelStats);
router.get('/', channelController.channels);

module.exports = router;
