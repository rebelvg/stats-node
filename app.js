const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');

const app = express();

if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('combined'));
}
app.use(bodyParser.json());
app.use(passport.initialize());
app.set('trust proxy', true);

const readToken = require('./middleware/read-token');

app.use(cors());
app.use(readToken);

const channels = require('./routes/channels');
const streams = require('./routes/streams');
const subscribers = require('./routes/subscribers');
const ips = require('./routes/ips');
const users = require('./routes/users');
const admin = require('./routes/admin');

app.use('/channels', channels);
app.use('/streams', streams);
app.use('/subscribers', subscribers);
app.use('/ips', ips);
app.use('/users', users);
app.use('/admin', admin);

app.use((req, res, next) => {
  throw new Error('Not found.');
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

module.exports = app;
