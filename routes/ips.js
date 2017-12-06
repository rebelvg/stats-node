const express = require('express');
const expressPaginate = require('express-paginate');

const ipController = require('../controllers/ips');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const IP = require('../models/ip');

let router = express.Router();

router.get('/:id', parseFilter('ip'), parseSort(IP), ipController.findById);
router.get('/', expressPaginate.middleware(10, 100), parseFilter('ip'), parseSort(IP), ipController.find);

module.exports = router;
