const mongoose = require('mongoose');
const { URL } = require('url');

const { db } = require('./config.json');

mongoose.Promise = Promise;

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
