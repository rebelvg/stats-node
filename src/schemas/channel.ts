import * as mongoose from 'mongoose';

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
