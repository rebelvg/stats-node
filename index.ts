import * as fs from 'fs';

import { app } from './app';
import { connectMongoose } from './mongo';

import './passport';
import './servers';

import { stats } from './config';

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

process.on('uncaughtException', error => {
  console.error('uncaughtException', error);

  process.exit(1);
});

// remove previous unix socket
if (typeof stats.port === 'string') {
  if (fs.existsSync(stats.port)) {
    fs.unlinkSync(stats.port);
  }
}

(async () => {
  await connectMongoose();

  app.listen(stats.port, () => {
    console.log('server is running.');

    // set unix socket rw rights for nginx
    if (typeof stats.port === 'string') {
      fs.chmodSync(stats.port, '777');
    }
  });
})();
