import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { User } from '../models/user';
import { ObjectId } from 'mongodb';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const userRecord = await User.findOne({
    _id: new ObjectId(ctx.params.id),
  });

  if (!userRecord) {
    throw new Error('user_not_found');
  }

  ctx.body = { user: userRecord };
}
