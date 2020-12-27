import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import * as _ from 'lodash';
import * as ip6addr from 'ip6addr';

import { liveStats } from '../workers';
import { ISubscriberModel } from '../models/subscriber';
import { ipService } from '../services/ip';

const Schema = mongoose.Schema;

export const schema = new Schema(
  {
    server: { type: String, required: true },
    app: { type: String, required: true },
    channel: { type: String, required: true },
    connectId: { type: String, required: true },
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
    streamIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true },
  },
  {
    retainKeyOrder: true,
  },
);

schema.pre(
  'validate',
  function (this: ISubscriberModel, next: mongoose.HookNextFunction) {
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
      this.duration > 0
        ? Math.ceil((this.bytes * 8) / this.duration / 1024)
        : 0;

    if (this.isNew) {
      this.createdAt = updatedAt;
    }

    this.updatedAt = updatedAt;

    next();
  },
);

schema.pre(
  'save',
  async function (this: ISubscriberModel, next: mongoose.HookNextFunction) {
    try {
      await ipService.upsert(this.ip);
    } catch (error) {
      console.log('subscriber_failed_to_save_ip', error);
    }

    return next();
  },
);

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
