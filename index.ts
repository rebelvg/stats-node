import * as fs from 'fs';

import { app } from './app';
import './mongo';
import './passport';
import './servers';

import { stats } from './config';

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

//remove previous unix socket
if (typeof stats.port === 'string') {
  if (fs.existsSync(stats.port)) {
    fs.unlinkSync(stats.port);
  }
}

app.listen(stats.port, () => {
  console.log('server is running.');

  //set unix socket rw rights for nginx
  if (typeof stats.port === 'string') {
    fs.chmodSync(stats.port, '777');
  }
});
