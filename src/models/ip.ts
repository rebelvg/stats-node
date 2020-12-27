import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

import { schema } from '../schemas/ip';

export interface IIPModel extends Document {
  ip: string;
  api: {
    as: string;
    city: string;
    country: string;
    countryCode: string;
    isp: string;
    lat: number;
    lon: number;
    org: string;
    query: string;
    region: string;
    regionName: string;
    status: string;
    timezone: string;
    zip: string;
    message: string;
  };
  createdAt: Date;
  updatedAt: Date;
  apiUpdatedAt: Date;
  isLocked: boolean;
}

export const IP = mongoose.model<IIPModel>('IP', schema);
