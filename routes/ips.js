const express = require('express');
const expressPaginate = require('express-paginate');

const ipController = require('../controllers/ips');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const IP = require('../models/ip');
const isLoggedIn = require('../middleware/is-logged-in');

const router = express.Router();

router.get('/:id', isLoggedIn, parseFilter('ip'), parseSort(IP), ipController.findById);
router.get('/', isLoggedIn, expressPaginate.middleware(10, 100), parseFilter('ip'), parseSort(IP), ipController.find);

module.exports = router;
