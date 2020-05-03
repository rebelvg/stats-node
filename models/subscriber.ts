import mongoose from 'mongoose';

import { schema } from '../schemas/subscriber';

export const Subscriber = mongoose.model<any>('Subscriber', schema);
