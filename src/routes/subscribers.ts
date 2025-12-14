import Router from '@koa/router';

import { findById, find } from '../controllers/subscribers';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { ISubscriberModel } from '../models/subscriber';

export const router = new Router();

const sortKeys = [
  '_id',
  'app',
  'bitrate',
  'bytes',
  'channel',
  'connectCreated',
  'connectId',
  'connectUpdated',
  'createdAt',
  'duration',
  'ip',
  'protocol',
  'server',
  'updatedAt',
  'userId',
] as const satisfies Array<keyof Partial<ISubscriberModel>>;

router.get('/:id', findById);
router.get('/', parseFilter('subscriber'), parseSort(sortKeys), find);
