import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';
import { shouldHideFields } from '../helpers/should-hide-fields';

import { User } from '../models/user';

export async function findById(ctx: Router.IRouterContext, next: Next) {
  const userId = ctx.params.id;

  const userRecord = await User.findById({ _id: userId });

  if (!userRecord) {
    throw new Error('user_not_found');
  }

  if (shouldHideFields(ctx.state.user)) {
    _.set(userRecord, 'ipCreated', undefined);
    _.set(userRecord, 'ipUpdated', undefined);
  }

  _.set(userRecord, 'googleId', undefined);
  _.set(userRecord, 'emails', undefined);
  _.set(userRecord, 'token', undefined);
  _.set(userRecord, 'streamKey', undefined);

  ctx.body = { user: userRecord };
}
