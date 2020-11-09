import * as Router from 'koa-router';
import * as koaPaginate from 'koa-ctx-paginate';

import { findById, find } from '../controllers/subscriber';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { Subscriber } from '../models/subscriber';

export const router = new Router();

router.get('/:id', findById);
router.get(
  '/',
  koaPaginate.middleware(10, 100),
  parseFilter('subscriber'),
  parseSort(Subscriber),
  find,
);
