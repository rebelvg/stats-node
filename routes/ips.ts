import * as express from 'express';
import * as expressPaginate from 'express-paginate';

import { findById, find } from '../controllers/ips';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { IP } from '../models/ip';
import { isLoggedIn } from '../middleware/is-logged-in';

export const router = express.Router();

router.get('/:id', isLoggedIn, parseFilter('ip'), parseSort(IP), findById);
router.get('/', isLoggedIn, expressPaginate.middleware(10, 100), parseFilter('ip'), parseSort(IP), find);
