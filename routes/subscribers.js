const express = require('express');
const expressPaginate = require('express-paginate');

const subscriberController = require('../controllers/subscriber');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const Subscriber = require('../models/subscriber');
const isLoggedIn = require('../middleware/isLoggedIn');

let router = express.Router();

router.get('/:id', isLoggedIn, subscriberController.findById);
router.get('/', isLoggedIn, expressPaginate.middleware(10, 100), parseFilter('subscriber'), parseSort(Subscriber), subscriberController.find);

module.exports = router;
