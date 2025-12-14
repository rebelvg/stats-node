import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';

import { hideUserData } from '../helpers/hide-fields';
import { shouldHideFields } from '../helpers/should-hide-fields';
import { User } from '../models/user';

export async function findById(ctx: Router.RouterContext, next: Next) {
  const userId = ctx.params.id;

  const userRecord = await User.findById({ _id: userId });

  if (!userRecord) {
    throw new Error('user_not_found');
  }

  const userRes = hideUserData(userRecord, shouldHideFields(ctx.state.user));

  ctx.body = { user: userRes };
}
