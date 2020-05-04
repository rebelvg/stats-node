import { Next } from 'koa';
import * as Router from 'koa-router';

import { find, update } from '../../controllers/admin/users';

export const router = new Router();

router.get('/', find);
router.put('/:id', update);
