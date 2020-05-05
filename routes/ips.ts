import * as Router from 'koa-router';
import * as koaPaginate from 'koa-ctx-paginate';

import { findById, find } from '../controllers/ips';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { IP } from '../models/ip';
import { isAdmin } from '../middleware/is-admin';

export const router = new Router();

router.get('/:id', isAdmin, parseFilter('ip'), parseSort(IP), findById);
router.get('/', isAdmin, koaPaginate.middleware(10, 100), parseFilter('ip'), parseSort(IP), find);
