import express from 'express';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import passport from 'passport';
import cors from 'cors';

export const app = express();

if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('combined'));
}
app.use(bodyParser.json());
app.use(passport.initialize());
app.set('trust proxy', true);

import readToken from './middleware/read-token';

app.use(cors());
app.use(readToken);

import channels from './routes/channels';
import streams from './routes/streams';
import subscribers from './routes/subscribers';
import ips from './routes/ips';
import users from './routes/users';
import admin from './routes/admin';

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
