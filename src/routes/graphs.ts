import Router from '@koa/router';

import { graphs, graphsById } from '../controllers/graphs';

export const router = new Router();

router.get('/', graphs);

router.get('/:id', graphsById);
