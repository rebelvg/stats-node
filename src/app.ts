import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router';
import koaQs from 'koa-qs';
import cors from '@koa/cors';
import koaMorgan from 'koa-morgan';
import * as fs from 'fs';
import koaSession from 'koa-session';
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
import { router as push } from './routes/push';

import { logger } from './helpers/logger';

if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

export const app = new Koa();

app.proxy = true;

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    const logBody = {
      method: ctx.method,
      href: ctx.href,
      headers: JSON.stringify(ctx.headers),
      body: ctx.request.body,
      status: error.status,
      error,
    };

    if (error.status) {
      logger.warn('http_warn', logBody);
    } else {
      logger.error('http_error', logBody);
    }

    ctx.status = error.status || 500;
    ctx.body = { error: error.message };
  }
});

app.keys = [uuid.v4()];

app.use(koaSession({ signed: true }, app));

app.use(koaMorgan('short', { stream: process.stdout }));
app.use(cors());

koaQs(app);

app.use(bodyParser({ enableTypes: ['json'] }));
app.use(readToken);

const router = new Router();

router.use('/channels', channels.routes());
router.use('/streams', streams.routes());
router.use('/subscribers', subscribers.routes());
router.use('/ips', ips.routes());
router.use('/users', users.routes());
router.use('/admin', admin.routes());
router.use('/graphs', graphs.routes());
router.use('/streamers', streamers.routes());
router.use('/push', push.routes());

app.use(router.routes());

app.use((ctx) => {
  logger.info('http_not_found', {
    method: ctx.method,
    href: ctx.href,
    ips: ctx.ips,
    ip: ctx.ip,
  });

  ctx.status = 404;
});
