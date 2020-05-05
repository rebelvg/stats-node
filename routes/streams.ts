import * as Router from 'koa-router';
import * as koaPaginate from 'koa-ctx-paginate';

import { findById, find, graph } from '../controllers/streams';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { Stream } from '../models/stream';

export const router = new Router();

router.get('/:id', parseFilter('stream'), parseSort(Stream), findById);
router.get('/', koaPaginate.middleware(10, 100), parseFilter('stream'), parseSort(Stream), find);
router.get('/:id/graph', parseFilter('stream'), graph);
