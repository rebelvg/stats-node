import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';

const Schema = mongoose.Schema;

export const schema = new Schema({
  ip: { type: String, required: true, unique: true, index: true },
  api: { type: Object, required: true },
  apiUpdatedAt: { type: Date, required: true, index: true },
  isLocked: { type: Boolean, required: true, index: true },
  createdAt: { type: Date, required: true, index: true },
  updatedAt: { type: Date, required: true, index: true },
});

schema.set('toJSON', { virtuals: true });

schema.plugin(mongoosePaginate);
