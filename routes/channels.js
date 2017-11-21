const express = require('express');

const channelController = require('../controllers/channels');

let router = express.Router();

router.get('/:server/:app/:channel', channelController.appChannelStats);
router.get('/:server/:channel', channelController.channelStats);
router.get('/', channelController.channels);

module.exports = router;
