import express from 'express';

import { find } from '../../controllers/admin/streamers';

export const router = express.Router();

router.get('/', find);
