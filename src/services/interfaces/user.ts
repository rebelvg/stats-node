import { ObjectId } from 'mongodb';

export interface IFindStreamers {
  _id: ObjectId;
  name: string;
  streamKey: string;
}
