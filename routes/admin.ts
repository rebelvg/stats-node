import express from 'express';

import { router as users } from '../routes/admin/users';
import { router as streamers } from '../routes/admin/streamers';
import { isLoggedIn } from '../middleware/is-logged-in';
import { isAdmin } from '../middleware/is-admin';

export const router = express.Router();

router.use(isLoggedIn);
router.use(isAdmin);
router.use('/users', users);
router.use('/streamers', streamers);
