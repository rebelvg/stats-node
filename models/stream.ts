import mongoose from 'mongoose';

import { schema } from '../schemas/stream';

export const Stream = mongoose.model<any>('Stream', schema);
