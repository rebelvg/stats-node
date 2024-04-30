import * as Router from 'koa-router';
import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

import { hideUserData } from '../helpers/hide-fields';
import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import { userService } from '../services/user';

const cachedGraphs: {
  all: {
    value: Record<string, unknown>;
    lastUpdateDate: Date;
  };
  ids: Map<
    string,
    {
      value: Record<string, unknown>;
      lastUpdateDate: Date;
    }
  >;
} = {
  all: null,
  ids: new Map(),
};

export const totalDurationQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $lookup: {
      from: 'ips',
      localField: 'ip',
      foreignField: 'ip',
      as: 'ips',
    },
  },
  {
    $unwind: {
      path: '$ips',
    },
  },
  {
    $group: {
      _id: '$ips.api.country',
      totalCount: { $sum: 1 },
      totalDurationSeconds: { $sum: '$duration' },
    },
  },
  // {
  //   $match: {
  //     _id: {
  //       $ne: null,
  //     },
  //   },
  // },
  // {
  //   $addFields: {
  //     totalDuration: {
  //       $round: [{ $divide: ['$totalDuration', 60 * 60 * 24] }, 0],
  //     },
  //   },
  // },
  {
    $project: {
      _id: 1,
      totalCount: 1,
      totalDurationSeconds: 1,
    },
  },
  {
    $sort: {
      totalDurationSeconds: -1,
    },
  },
];

export const avgStatsQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $group: {
      _id: null,
      averageBitrateKbps: {
        $avg: '$bitrate',
      },
      averageTrafficBytes: {
        $avg: '$bytes',
      },
      averageDurationSeconds: {
        $avg: '$duration',
      },
    },
  },
];

export const topStreamersQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $group: {
      totalCount: {
        $sum: 1,
      },
      _id: '$userId',
      totalDurationSeconds: {
        $sum: '$duration',
      },
      totalBytes: {
        $sum: '$bytes',
      },
    },
  },
  // {
  //   $match: {
  //     _id: {
  //       $ne: null,
  //     },
  //   },
  // },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user',
    },
  },
  {
    $unwind: {
      path: '$user',
    },
  },
  {
    $sort: {
      totalDurationSeconds: -1,
    },
  },
];

export const monthlyStatsQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $project: {
      year: {
        $year: '$connectCreated',
      },
      month: {
        $month: '$connectCreated',
      },
      day: {
        $dayOfMonth: '$connectCreated',
      },
      hour: {
        $hour: '$connectCreated',
      },
      minutes: {
        $minute: '$connectCreated',
      },
      seconds: {
        $second: '$connectCreated',
      },
      milliseconds: {
        $millisecond: '$connectCreated',
      },
      dayOfYear: {
        $dayOfYear: '$connectCreated',
      },
      dayOfWeek: {
        $isoDayOfWeek: '$connectCreated',
      },
      week: {
        $week: '$connectCreated',
      },
      duration: {
        $sum: '$duration',
      },
    },
  },
  {
    $group: {
      _id: {
        year: '$year',
        month: '$month',
      },
      totalCount: {
        $sum: 1,
      },
      totalDurationSeconds: {
        $sum: '$duration',
      },
    },
  },
  {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
    },
  },
];

export const weekDayStatsQuery = [
  {
    $project: {
      year: {
        $year: '$connectCreated',
      },
      month: {
        $month: '$connectCreated',
      },
      day: {
        $dayOfMonth: '$connectCreated',
      },
      hour: {
        $hour: '$connectCreated',
      },
      minutes: {
        $minute: '$connectCreated',
      },
      seconds: {
        $second: '$connectCreated',
      },
      milliseconds: {
        $millisecond: '$connectCreated',
      },
      dayOfYear: {
        $dayOfYear: '$connectCreated',
      },
      dayOfWeek: {
        $isoDayOfWeek: '$connectCreated',
      },
      week: {
        $week: '$connectCreated',
      },
      duration: {
        $sum: '$duration',
      },
    },
  },
  {
    $group: {
      _id: '$dayOfWeek',
      totalCount: {
        $sum: 1,
      },
      totalDurationSeconds: {
        $sum: '$duration',
      },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
];

export const timeOfDayStatsQuery = [
  {
    $project: {
      year: {
        $year: '$connectCreated',
      },
      month: {
        $month: '$connectCreated',
      },
      day: {
        $dayOfMonth: '$connectCreated',
      },
      hour: {
        $hour: '$connectCreated',
      },
      minutes: {
        $minute: '$connectCreated',
      },
      seconds: {
        $second: '$connectCreated',
      },
      milliseconds: {
        $millisecond: '$connectCreated',
      },
      dayOfYear: {
        $dayOfYear: '$connectCreated',
      },
      dayOfWeek: {
        $isoDayOfWeek: '$connectCreated',
      },
      week: {
        $week: '$connectCreated',
      },
      duration: {
        $sum: '$duration',
      },
    },
  },
  {
    $group: {
      _id: '$hour',
      totalCount: {
        $sum: 1,
      },
      totalDurationSeconds: {
        $sum: '$duration',
      },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
];

export const totalDurationSubscribersQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $lookup: {
      from: 'subscribers',
      localField: '_id',
      foreignField: 'streamIds',
      as: 'subscribers',
    },
  },
  {
    $unwind: {
      path: '$subscribers',
    },
  },
  {
    $lookup: {
      from: 'ips',
      localField: 'subscribers.ip',
      foreignField: 'ip',
      as: 'ips',
    },
  },
  {
    $unwind: {
      path: '$ips',
    },
  },
  {
    $group: {
      _id: '$ips.api.country',
      totalCount: { $sum: 1 },
      totalDurationSeconds: { $sum: '$subscribers.duration' },
    },
  },
  // {
  //   $match: {
  //     _id: {
  //       $ne: null,
  //     },
  //   },
  // },
  // {
  //   $addFields: {
  //     totalDuration: {
  //       $round: [{ $divide: ['$totalDuration', 60 * 60 * 24] }, 0],
  //     },
  //   },
  // },
  {
    $project: {
      _id: 1,
      totalCount: 1,
      totalDurationSeconds: 1,
    },
  },
  {
    $sort: {
      totalDurationSeconds: -1,
    },
  },
];

const monthlyStatsSubscribersQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $lookup: {
      from: 'subscribers',
      localField: '_id',
      foreignField: 'streamIds',
      as: 'subscribers',
    },
  },
  {
    $unwind: {
      path: '$subscribers',
    },
  },
  {
    $project: {
      year: {
        $year: '$subscribers.connectCreated',
      },
      month: {
        $month: '$subscribers.connectCreated',
      },
      day: {
        $dayOfMonth: '$subscribers.connectCreated',
      },
      hour: {
        $hour: '$subscribers.connectCreated',
      },
      minutes: {
        $minute: '$subscribers.connectCreated',
      },
      seconds: {
        $second: '$subscribers.connectCreated',
      },
      milliseconds: {
        $millisecond: '$subscribers.connectCreated',
      },
      dayOfYear: {
        $dayOfYear: '$subscribers.connectCreated',
      },
      dayOfWeek: {
        $isoDayOfWeek: '$subscribers.connectCreated',
      },
      week: {
        $week: '$subscribers.connectCreated',
      },
      duration: {
        $sum: '$subscribers.duration',
      },
    },
  },
  {
    $group: {
      _id: {
        year: '$year',
        month: '$month',
      },
      totalCount: {
        $sum: 1,
      },
      totalDurationSeconds: {
        $sum: '$duration',
      },
    },
  },
  {
    $sort: {
      '_id.year': 1,
      '_id.month': 1,
    },
  },
];

export async function graphs(ctx: Router.IRouterContext) {
  if (
    Date.now() <
    cachedGraphs.all?.lastUpdateDate.getTime() + 24 * 60 * 60 * 1000
  ) {
    ctx.body = cachedGraphs.all.value;

    return;
  }

  const totalDurationStreams = await Stream.aggregate([
    ...totalDurationQuery,
    { $limit: 5 },
  ]);

  const totalDurationSubscribers = await Subscriber.aggregate([
    ...totalDurationQuery,
    { $limit: 5 },
  ]);

  const avgStatsStreams = await Stream.aggregate([...avgStatsQuery]);

  const avgStatsSubscribers = await Subscriber.aggregate([...avgStatsQuery]);

  const topStreamersResult = await Stream.aggregate([
    ...topStreamersQuery,
    { $limit: 5 },
  ]);

  const topStreamers = topStreamersResult.map((topUser) => ({
    ...topUser,
    user: hideUserData(topUser.user, true),
  }));

  const monthlyStatsStreams = await Stream.aggregate([...monthlyStatsQuery]);

  const monthlyStatsSubscribers = await Subscriber.aggregate([
    ...monthlyStatsQuery,
  ]);

  const dayOfWeekStatsStreams = await Stream.aggregate([...weekDayStatsQuery]);

  const dayOfWeekStatsSubscribers = await Subscriber.aggregate([
    ...weekDayStatsQuery,
  ]);

  const timeOfDayStatsStreams = await Stream.aggregate([
    ...timeOfDayStatsQuery,
  ]);

  const timeOfDayStatsSubscribers = await Subscriber.aggregate([
    ...timeOfDayStatsQuery,
  ]);

  const body = {
    totalDurationStreams,
    totalDurationSubscribers,
    avgStatsStreams,
    avgStatsSubscribers,
    topStreamers,
    monthlyStatsStreams,
    monthlyStatsSubscribers,
    dayOfWeekStatsStreams,
    dayOfWeekStatsSubscribers,
    timeOfDayStatsStreams,
    timeOfDayStatsSubscribers,
  };

  ctx.body = body;

  cachedGraphs.all = {
    value: body,
    lastUpdateDate: new Date(),
  };
}

export async function graphsById(ctx: Router.RouterContext) {
  const { id } = ctx.params;

  if (
    Date.now() <
    cachedGraphs.ids[id]?.lastUpdateDate.getTime() + 24 * 60 * 60 * 1000
  ) {
    ctx.body = cachedGraphs.ids[id].value;

    return;
  }

  const userRecord = await userService.getById(id);

  const totalDurationStreams = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...totalDurationQuery,
    { $limit: 5 },
  ]);

  const totalDurationSubscribers = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...totalDurationSubscribersQuery,
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

  const monthlyStatsStreams = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...monthlyStatsQuery,
  ]);

  const monthlyStatsSubscribers = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...monthlyStatsSubscribersQuery,
  ]);

  const dayOfWeekStatsStreams = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...weekDayStatsQuery,
  ]);

  const timeOfDayStatsStreams = await Stream.aggregate([
    {
      $match: {
        userId: new ObjectId(id),
      },
    },
    ...timeOfDayStatsQuery,
  ]);

  const body = {
    totalDurationStreams,
    totalDurationSubscribers,
    topStreamers: topStreamersRes,
    monthlyStatsStreams,
    monthlyStatsSubscribers,
    dayOfWeekStatsStreams,
    timeOfDayStatsStreams,
    user: hideUserData(userRecord, true),
  };

  ctx.body = body;

  cachedGraphs.ids[id] = {
    value: body,
    lastUpdateDate: new Date(),
  };
}
