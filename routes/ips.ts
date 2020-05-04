import { Next } from 'koa';
import * as Router from 'koa-router';
import * as koaPaginate from 'koa-ctx-paginate';

import { findById, find } from '../controllers/ips';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { IP } from '../models/ip';
import { isLoggedIn } from '../middleware/is-logged-in';

export const router = new Router();

router.get('/:id', isLoggedIn, parseFilter('ip'), parseSort(IP), findById);
router.get('/', isLoggedIn, koaPaginate.middleware(10, 100), parseFilter('ip'), parseSort(IP), find);
