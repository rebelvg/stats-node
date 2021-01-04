import * as fs from 'fs';

import { app } from './app';
import { connectMongoose } from './mongo';

import { API } from './config';
import { runUpdate as runUpdate_kms } from './workers/klpq-media-server';
import { runUpdate as runUpdate_ams } from './workers/adobe-media-server';

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

process.on('uncaughtException', (error) => {
  console.error('uncaughtException', error);

  process.exit(1);
});

// remove previous unix socket
if (typeof API.PORT === 'string') {
  if (fs.existsSync(API.PORT)) {
    fs.unlinkSync(API.PORT);
  }
}

(async () => {
  await connectMongoose();

  app.listen(API.PORT, () => {
    console.log('http_server_running');

    // set unix socket rw rights for nginx
    if (typeof API.PORT === 'string') {
      fs.chmodSync(API.PORT, '777');
    }
  });

  runUpdate_kms();
  runUpdate_ams();
})();
