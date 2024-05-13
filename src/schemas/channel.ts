import * as mongoose from 'mongoose';
import { IChannelModel } from '../models/channel';

const Schema = mongoose.Schema;

export const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    channelCreatedAt: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date(),
    },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
);

schema.pre('validate', function (this: IChannelModel, next) {
  const currentTime = new Date();

  if (this.isNew) {
    this.createdAt = currentTime;
  }

  this.updatedAt = currentTime;

  next();
});
