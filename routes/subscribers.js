const express = require('express');
const expressPaginate = require('express-paginate');

const subscriberController = require('../controllers/subscriber');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const Subscriber = require('../models/subscriber');

let router = express.Router();

router.get('/:id', subscriberController.findById);
router.get('/', expressPaginate.middleware(10, 50), parseFilter(Subscriber), parseSort(Subscriber), subscriberController.find);

module.exports = router;
