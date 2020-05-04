import * as mongoose from 'mongoose';
import * as mongoosePaginate from 'mongoose-paginate';
import axios from 'axios';

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

schema.pre('validate', async function(next: mongoose.HookNextFunction) {
  try {
    if (!this.api) {
      const { data } = await axios.get(`${apiLink}/${this.ip}`);

      this.api = data;
    }
  } catch (error) {}

  next();
});

schema.pre('validate', function(next: mongoose.HookNextFunction) {
  const updatedAt = new Date();

  if (this.isNew) {
    this.createdAt = updatedAt;
  }

  this.updatedAt = updatedAt;

  next();
});

schema.set('toJSON', { virtuals: true });

schema.plugin(mongoosePaginate);
