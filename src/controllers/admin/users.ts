import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { IUserModel, User } from '../../models/user';
import { ObjectId } from 'mongodb';

export async function find(ctx: Router.RouterContext, next: Next) {
  const users = await User.find(
    {},
    {
      sort: {
        isAdmin: -1,
        isStreamer: -1,
        createdAt: -1,
      },
    },
  );

  ctx.body = {
    users,
  };
}

export async function update(ctx: Router.RouterContext, next: Next) {
  const body = <Partial<IUserModel>>ctx.request.body;

  await User.updateOne(
    { _id: new ObjectId(ctx.params.id) },
    {
      ...body,
    },
  );

  ctx.body = {
    user: await User.findOne({
      _id: new ObjectId(ctx.params.id),
    }),
  };
}
