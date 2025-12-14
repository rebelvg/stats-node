import Router from '@koa/router';

import { findById, find } from '../controllers/subscribers';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { Subscriber } from '../models/subscriber';

export const router = new Router();

router.get('/:id', findById);
router.get('/', parseFilter('subscriber'), parseSort(Subscriber), find);
