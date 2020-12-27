import * as Router from 'koa-router';

import { find, graph } from '../controllers/streamers';

export const router = new Router();

router.get('/', find);

router.get('/:id/graph', graph);
