import * as mongoose from 'mongoose';
import * as uuid from 'uuid';
import { IUserModel } from '../models/user';

const Schema = mongoose.Schema;

export const schema = new Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ipCreated: { type: String },
  ipUpdated: { type: String },
  isAdmin: { type: Boolean, required: true },
  isStreamer: { type: Boolean, required: true },
  token: { type: String, required: true, unique: true, index: true },
  streamKey: { type: String, required: true, unique: true, index: true },
  createdAt: { type: Date, required: true, index: true },
  updatedAt: { type: Date, required: true, index: true },
});

schema.pre('validate', function (this: IUserModel, next) {
  if (this.isNew) {
    this.isAdmin = false;
    this.isStreamer = false;
    this.token = uuid.v4();
    this.streamKey = uuid.v4();
  }

  next();
});

schema.pre('validate', function (this: IUserModel, next) {
  const updatedAt = new Date();

  if (this.isNew) {
    this.createdAt = updatedAt;
  }

  this.updatedAt = updatedAt;

  next();
});
