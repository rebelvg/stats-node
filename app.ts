import * as express from 'express';
import * as morgan from 'morgan';
import * as bodyParser from 'body-parser';
import * as passport from 'passport';
import * as cors from 'cors';

export const app = express();

if (process.env.NODE_ENV === 'dev') {
  app.use(morgan('combined'));
}
app.use(bodyParser.json());
app.use(passport.initialize());
app.set('trust proxy', true);

import { readToken } from './middleware/read-token';

app.use(cors());
app.use(readToken);

import { router as channels } from './routes/channels';
import { router as streams } from './routes/streams';
import { router as subscribers } from './routes/subscribers';
import { router as ips } from './routes/ips';
import { router as users } from './routes/users';
import { router as admin } from './routes/admin';

app.use('/channels', channels);
app.use('/streams', streams);
app.use('/subscribers', subscribers);
app.use('/ips', ips);
app.use('/users', users);
app.use('/admin', admin);

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  throw new Error('Not found.');
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});
