import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate';
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

schema.pre('validate', async function(next) {
  try {
    const { data } = await axios.get(`${apiLink}/${this.ip}`);

    this.api = data;

    next();
  } catch (error) {
    next(error);
  }
});

schema.pre('validate', function(next) {
  const updatedAt = new Date();

  if (this.isNew) {
    this.createdAt = updatedAt;
  }

  this.updatedAt = updatedAt;

  next();
});

schema.set('toJSON', { virtuals: true });

schema.plugin(mongoosePaginate);
