import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import Router from '@koa/router';
import koaQs from 'koa-qs';
import cors from '@koa/cors';
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
import { router as push } from './routes/push';

interface IHttpState {
  user: WithId<IUserModel> | null;
  query: any;
  sort: Sort;
}

declare module 'koa' {
  interface Context {
    state: IHttpState;
  }

  interface DefaultState extends IHttpState {}
}

declare module '@koa/router' {
  interface IRouterContext {
    state: IHttpState;
  }
}

import { logger } from './helpers/logger';
import { IUserModel } from './models/user';
import { Sort, WithId } from 'mongodb';

export const app = new Koa();

app.proxy = true;

app.use(async (ctx, next) => {
  ctx.state = {
    user: null,
    query: {},
    sort: {},
  };

  const startTime = Date.now();

  try {
    await next();

    logger.info('http', [
      ctx.ip,
      ctx.method,
      ctx.status,
      ctx.url,
      `${Date.now() - startTime}ms`,
    ]);
  } catch (error) {
    ctx.status = error.status || 500;
    ctx.body = { error: error.message };

    logger.error('error', { error });
    logger.error('http', [
      ctx.ip,
      ctx.method,
      ctx.status,
      ctx.url,
      `${Date.now() - startTime}ms`,
      ctx.query,
      ctx.request.body,
    ]);
  }
});

app.keys = [uuid.v4()];

app.use(koaSession({ signed: true }, app));

app.use(cors());

koaQs(app);

app.use(bodyParser({ enableTypes: ['json'] }));
app.use(readToken);

const router = new Router();

const v1 = new Router();

v1.use('/channels', channels.routes());
v1.use('/streams', streams.routes());
v1.use('/subscribers', subscribers.routes());
v1.use('/ips', ips.routes());
v1.use('/users', users.routes());
v1.use('/admin', admin.routes());
v1.use('/graphs', graphs.routes());
v1.use('/push', push.routes());

router.use('/v1', v1.routes());

app.use(router.routes());

app.use((ctx) => {
  ctx.status = 404;
});
