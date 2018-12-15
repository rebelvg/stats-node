const express = require('express');

const channelController = require('../controllers/channels');
const isLoggedIn = require('../middleware/is-logged-in');

const router = express.Router();

router.get('/legacy/:server/:channel', channelController.legacy);
router.get('/:server/:app/:channel', channelController.appChannelStats);
router.get('/:server/:channel', channelController.channelStats);
router.get('/', isLoggedIn, channelController.channels);

module.exports = router;
