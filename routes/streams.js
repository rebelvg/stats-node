const express = require('express');
const expressPaginate = require('express-paginate');

const streamController = require('../controllers/streams');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const Stream = require('../models/stream');

const router = express.Router();

router.get('/:id', parseFilter('stream'), parseSort(Stream), streamController.findById);
router.get('/', expressPaginate.middleware(10, 100), parseFilter('stream'), parseSort(Stream), streamController.find);
router.get('/:id/graph', parseFilter('stream'), streamController.graph);

module.exports = router;
