import * as Router from 'koa-router';
import { ObjectId } from 'mongodb';
import { hideUserData } from '../helpers/hide-fields';

import { Stream } from '../models/stream';
import { topStreamersQuery, totalDurationQuery } from './graphs';

export function find(ctx: Router.IRouterContext) {
  ctx.body;
}

export async function graph(ctx: Router.RouterContext) {
  const { id } = ctx.params;

  const totalDurationStreams = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...totalDurationQuery,
    { $limit: 5 },
  ]);

  const topStreamers = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...topStreamersQuery,
    { $limit: 5 },
  ]);

  const topStreamersRes = topStreamers.map((topUser) => ({
    ...topUser,
    user: hideUserData(topUser.user, true),
  }));

  ctx.body = {
    totalDurationStreams,
    topStreamers: topStreamersRes,
  };
}
