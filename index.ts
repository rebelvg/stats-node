import * as fs from 'fs';

import { app } from './app';
import { connectMongoose } from './mongo';

import './passport';
import './workers';

import { API } from './config';

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

process.on('uncaughtException', (error) => {
  console.error('uncaughtException', error);

  process.exit(1);
});

// remove previous unix socket
if (typeof API.port === 'string') {
  if (fs.existsSync(API.port)) {
    fs.unlinkSync(API.port);
  }
}

(async () => {
  await connectMongoose();

  app.listen(API.port, () => {
    console.log('http_server_running');

    // set unix socket rw rights for nginx
    if (typeof API.port === 'string') {
      fs.chmodSync(API.port, '777');
    }
  });
})();
