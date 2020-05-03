import express from 'express';

import { find, update } from '../../controllers/admin/users';

export const router = express.Router();

router.get('/', find);
router.put('/:id', update);
