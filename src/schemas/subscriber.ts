import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as _ from 'lodash';
import * as ip6addr from 'ip6addr';

import { liveStats } from '../workers';
import { ISubscriberModel } from '../models/subscriber';
import { ipService } from '../services/ip';
import { logger } from '../helpers/logger';

const Schema = mongoose.Schema;

export const schema = new Schema({
  server: { type: String, required: true, index: true },
  app: { type: String, required: true, index: true },
  channel: { type: String, required: true, index: true },
  connectId: { type: String, required: true, index: true },
  connectCreated: { type: Date, required: true, index: true },
  connectUpdated: { type: Date, required: true, index: true },
  bytes: { type: Number, required: true },
  ip: { type: String, required: true },
  protocol: { type: String, required: true },
  duration: { type: Number, required: true },
  bitrate: { type: Number, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true,
    default: null,
  },
  apiSource: { type: String, required: false, default: null },
  apiResponse: { type: Object, required: false, default: null },
  streamIds: {
    type: [Schema.Types.ObjectId],
    // disabled required since mongoose 4 expects array to have at least one item
    // required: true,
    default: [],
    index: true,
  },
  createdAt: { type: Date, required: true, index: true },
  updatedAt: { type: Date, required: true, index: true },
});

schema.pre('validate', function (this: ISubscriberModel, next) {
  const updatedAt = new Date();

  if (this.isNew) {
    const addr = ip6addr.parse(this.ip);

    this.ip =
      addr.kind() === 'ipv6'
        ? addr.toString({ format: 'v6' })
        : addr.toString({ format: 'v4' });
  }

  this.duration = Math.ceil(
    (this.connectUpdated.valueOf() - this.connectCreated.valueOf()) / 1000,
  );

  this.bitrate =
    this.duration > 0 ? Math.ceil((this.bytes * 8) / this.duration / 1024) : 0;

  if (this.isNew) {
    this.createdAt = updatedAt;
  }

  this.updatedAt = updatedAt;

  next();
});

schema.pre('save', async function (this: ISubscriberModel, next) {
  try {
    await ipService.upsert(this.ip);
  } catch (error) {
    logger.error('subscriber_failed_to_save_ip', {
      error,
    });
  }

  return next();
});

schema.virtual('isLive').get(function (this: ISubscriberModel) {
  const subscribers =
    liveStats?.[this.server]?.[this.app]?.[this.channel]?.subscribers || [];

  return !!_.find(subscribers, ['id', this.id]);
});

schema.virtual('location', {
  ref: 'IP',
  localField: 'ip',
  foreignField: 'ip',
  justOne: true,
});

schema.set('toJSON', { virtuals: true });

schema.plugin(mongoosePaginate);
