const express = require('express');
const expressPaginate = require('express-paginate');

const streamController = require('../controllers/streams');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const Stream = require('../models/stream');

let router = express.Router();

router.get('/:id', streamController.findById);
router.get('/', expressPaginate.middleware(10, 100), parseFilter(Stream), parseSort(Stream), streamController.find);
router.get('/:id/graph', streamController.graph);

module.exports = router;
