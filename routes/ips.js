const express = require('express');
const expressPaginate = require('express-paginate');

const streamController = require('../controllers/streams');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const IP = require('../models/ip');

let router = express.Router();

router.get('/:id', streamController.findById);
router.get('/', expressPaginate.middleware(10, 100), parseFilter(IP), parseSort(IP), streamController.find);

module.exports = router;
