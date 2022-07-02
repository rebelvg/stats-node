import * as fs from 'fs';

(() => {
  console.log(fs.readFileSync('./config.json').toString('base64'));
})();
