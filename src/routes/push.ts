import * as Router from 'koa-router';

export const router = new Router();

router.post('/', (ctx, next) => {
  ctx.body = {};
});
