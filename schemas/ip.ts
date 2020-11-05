import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import axios from 'axios';
import { IIPModel } from '../models/ip';

const Schema = mongoose.Schema;

const apiLink = `http://ip-api.com/json`;

export const schema = new Schema(
  {
    ip: { type: String, required: true, unique: true, index: true },
    api: { type: Object, required: true },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true }
  },
  {
    retainKeyOrder: true
  }
);

schema.pre('validate', async function(this: IIPModel, next: mongoose.HookNextFunction) {
  try {
    const isRecordMonthOld = new Date().valueOf() - this.apiUpdatedAt?.valueOf() > 30 * 24 * 60 * 60 * 1000;

    if (!this.api || isRecordMonthOld) {
      const { data } = await axios.get(`${apiLink}/${this.ip}`);

      this.api = data;

      this.apiUpdatedAt = new Date();
    }
  } catch (error) {
    console.log('ips_validate_error', error);
  }

  next();
});

schema.pre('validate', function(this: IIPModel, next: mongoose.HookNextFunction) {
  const currentTime = new Date();

  if (this.isNew) {
    this.createdAt = currentTime;
  }

  this.updatedAt = currentTime;

  next();
});

schema.set('toJSON', { virtuals: true });

schema.plugin(mongoosePaginate);
