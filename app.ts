import * as Koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as Router from 'koa-router';
import * as koaQs from 'koa-qs';
import * as passport from 'koa-passport';
import * as cors from '@koa/cors';
import * as koaMorgan from 'koa-morgan';

import { readToken } from './middleware/read-token';

import { router as channels } from './routes/channels';
import { router as streams } from './routes/streams';
import { router as subscribers } from './routes/subscribers';
import { router as ips } from './routes/ips';
import { router as users } from './routes/users';
import { router as admin } from './routes/admin';

export const app = new Koa();

app.use(koaMorgan('combined', { immediate: true }));
app.use(koaMorgan('short'));
app.use(cors());

app.use(passport.initialize());

koaQs(app);

app.use(bodyParser({ enableTypes: ['json'] }));
app.use(readToken);

app.proxy = true;

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.log('http_error', error);

    ctx.status = error.status || 500;
    ctx.body = { error: error.message };
  }
});

const router = new Router();

router.use('/channels', channels.routes());
router.use('/streams', streams.routes());
router.use('/subscribers', subscribers.routes());
router.use('/ips', ips.routes());
router.use('/users', users.routes());
router.use('/admin', admin.routes());

app.use(router.routes());

app.use(ctx => {
  ctx.throw(404);
});
