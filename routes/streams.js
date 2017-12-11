const express = require('express');
const expressPaginate = require('express-paginate');

const streamController = require('../controllers/streams');
const parseFilter = require('../middleware/query');
const parseSort = require('../middleware/sort');
const Stream = require('../models/stream');
const isLoggedIn = require('../middleware/isLoggedIn');

let router = express.Router();

router.get('/:id', isLoggedIn, parseFilter('stream'), parseSort(Stream), streamController.findById);
router.get('/', isLoggedIn, expressPaginate.middleware(10, 100), parseFilter('stream'), parseSort(Stream), streamController.find);
router.get('/:id/graph', isLoggedIn, parseFilter('stream'), streamController.graph);

module.exports = router;
