import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';

import { User } from '../../models/user';

export async function find(ctx: Router.IRouterContext, next: Next) {
  const users = await User.find(null, null, {
    sort: {
      createdAt: -1,
    },
  });

  ctx.body = {
    users,
  };
}

export async function update(ctx: Router.IRouterContext, next: Next) {
  const user = await User.findOne({
    _id: ctx.params.id,
  });

  if (!user) {
    throw Error('user_not_found');
  }

  _.forEach(ctx.request.body, (value, key) => {
    user[key] = value;
  });

  await user.save();

  ctx.body = {
    user,
  };
}
