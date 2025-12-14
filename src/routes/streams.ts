import Router from '@koa/router';

import { findById, find, graph } from '../controllers/streams';
import { parseFilter } from '../middleware/query';
import { parseSort } from '../middleware/sort';
import { IStreamModel } from '../models/stream';

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
  'lastBitrate',
  'peakViewersCount',
  'protocol',
  'server',
  'totalConnectionsCount',
  'updatedAt',
  'userId',
] as const satisfies Array<keyof Partial<IStreamModel>>;

router.get('/:id', parseFilter('stream'), parseSort(sortKeys), findById);
router.get('/', parseFilter('stream'), parseSort(sortKeys), find);
router.get('/:id/graph', parseFilter('stream'), graph);
