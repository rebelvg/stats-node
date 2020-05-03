import * as mongoose from 'mongoose';
import { URL } from 'url';

import { db } from './config';

(mongoose as any).Promise = Promise;

const mongoUrl = new URL(`mongodb://${db.host}/${db.dbName}`);

if (db.authDb) {
  mongoUrl.username = encodeURIComponent(db.user);
  mongoUrl.password = encodeURIComponent(db.password);

  mongoUrl.searchParams.set('authSource', db.authDb);
}

mongoose.connect(
  mongoUrl.href,
  { useMongoClient: true },
  error => {
    if (error) {
      throw error;
    }
  }
);
