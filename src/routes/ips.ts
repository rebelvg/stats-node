import Router from '@koa/router';

import { findById, find } from '../controllers/ips';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { IP } from '../models/ip';
import { isAdmin } from '../middleware/is-admin';

export const router = new Router();

router.get('/:id', isAdmin, parseFilter('ip'), parseSort(IP), findById);
router.get('/', isAdmin, parseFilter('ip'), parseSort(IP), find);
