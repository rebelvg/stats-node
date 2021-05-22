import * as mongoose from 'mongoose';

const Schema = mongoose.Schema;

export const schema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    createdAt: { type: Date, required: true, index: true },
    updatedAt: { type: Date, required: true, index: true },
  },
  {
    retainKeyOrder: true,
  },
);
