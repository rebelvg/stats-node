import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as koaQs from 'koa-qs';
import * as passport from 'koa-passport';
import * as cors from '@koa/cors';
import * as koaMorgan from 'koa-morgan';
import * as fs from 'fs';
import * as koaSession from 'koa-session';
import * as uuid from 'uuid';

import { readToken } from './middleware/read-token';

import { router as channels } from './routes/channels';
import { router as streams } from './routes/streams';
import { router as subscribers } from './routes/subscribers';
import { router as ips } from './routes/ips';
import { router as users } from './routes/users';
import { router as admin } from './routes/admin';
import { router as graphs } from './routes/graphs';
import { router as streamers } from './routes/streamers';

import './passport';
import { logger, setLogger } from './helpers/logger';

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

const logFileStream = fs.createWriteStream('./logs/access.log', { flags: 'a' });

export const app = new Koa();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    logger.error('http_error', {
      method: ctx.method,
      href: ctx.href,
      headers: JSON.stringify(ctx.headers),
      body: ctx.body,
      error,
    });

    ctx.status = error.status || 500;
    ctx.body = { error: error.message };
  }
});

app.keys = [uuid.v4()];

app.use(koaSession({ signed: true }, app));

app.use(setLogger);

app.use(koaMorgan('combined', { immediate: true, stream: logFileStream }));
app.use(koaMorgan('short', { stream: logFileStream }));
app.use(cors());

app.use(passport.initialize());

koaQs(app);

app.use(bodyParser({ enableTypes: ['json'] }));
app.use(readToken);

app.proxy = true;

const router = new Router();

router.use('/channels', channels.routes());
router.use('/streams', streams.routes());
router.use('/subscribers', subscribers.routes());
router.use('/ips', ips.routes());
router.use('/users', users.routes());
router.use('/admin', admin.routes());
router.use('/graphs', graphs.routes());
router.use('/streamers', streamers.routes());

app.use(router.routes());

app.use((ctx) => {
  logger.info('http_not_found', {
    method: ctx.method,
    href: ctx.href,
  });

  ctx.status = 404;
});
