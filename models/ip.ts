import mongoose from 'mongoose';

import { schema } from '../schemas/ip';

export const IP = mongoose.model<any>('IP', schema);
