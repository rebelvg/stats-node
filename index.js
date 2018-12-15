const fs = require('fs');

const { stats } = require('./config.json');

const app = require('./app');
require('./mongo-connect');
require('./passport');
require('./servers');

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
