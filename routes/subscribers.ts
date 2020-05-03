import express from 'express';
import expressPaginate from 'express-paginate';

import { findById, find } from '../controllers/subscriber';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { Subscriber } from '../models/subscriber';

export const router = express.Router();

router.get('/:id', findById);
router.get('/', expressPaginate.middleware(10, 100), parseFilter('subscriber'), parseSort(Subscriber), find);
