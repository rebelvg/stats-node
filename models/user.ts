import mongoose from 'mongoose';

import { schema } from '../schemas/user';

export const User = mongoose.model<any>('User', schema);
