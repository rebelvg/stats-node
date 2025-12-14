import Router from '@koa/router';

import { findById, find } from '../controllers/ips';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { IIPModel } from '../models/ip';
import { isAdmin } from '../middleware/is-admin';

export const router = new Router();

const sortKeys = [
  '_id',
  'ip',
  'apiUpdatedAt',
  'createdAt',
  'updatedAt',
] as const satisfies Array<keyof Partial<IIPModel>>;

router.get('/:id', isAdmin, findById);
router.get(
  '/',
  isAdmin,
  parseFilter('ip'),
  parseSort([...sortKeys, 'api.country', 'api.city', 'api.isp']),
  find,
);
