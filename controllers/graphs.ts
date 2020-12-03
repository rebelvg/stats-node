import * as Router from 'koa-router';
import * as _ from 'lodash';
import { hideUserData } from '../helpers/hide-fields';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';

const totalDurationQuery = [
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
      totalDurationSeconds: 1,
    },
  },
  {
    $sort: { totalDurationSeconds: -1 },
  },
];

const avgStatsQuery = [
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

const topStreamersQuery = [
  {
    $match: {
      app: 'live',
    },
  },
  {
    $group: {
      _id: '$userId',
      totalDuration: {
        $sum: '$duration',
      },
      totalCount: {
        $sum: 1,
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
      totalDuration: -1,
    },
  },
];

const monthlyStatsQuery = [
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
      totalDuration: {
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
      totalDuration: {
        $sum: '$totalDuration',
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

const weekDayStatsQuery = [
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
      totalDuration: {
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
      totalDuration: {
        $sum: '$totalDuration',
      },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
];

const timeOfDayStatsQuery = [
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
      totalDuration: {
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
      totalDuration: {
        $sum: '$totalDuration',
      },
    },
  },
  {
    $sort: {
      _id: 1,
    },
  },
];

export async function graphs(ctx: Router.IRouterContext) {
  const totalDurationStreams = await Stream.aggregate([
    ...totalDurationQuery,
    { $limit: 5 },
  ]);

  const totalDurationSubs = await Subscriber.aggregate([
    ...totalDurationQuery,
    { $limit: 5 },
  ]);

  const avgStatsStreams = await Stream.aggregate([...avgStatsQuery]);

  const avgStatsSubs = await Subscriber.aggregate([...avgStatsQuery]);

  const topStreamers = await Stream.aggregate([
    ...topStreamersQuery,
    { $limit: 5 },
  ]);

  const monthlyStatsStreams = await Stream.aggregate([...monthlyStatsQuery]);

  const monthlyStatsSubs = await Subscriber.aggregate([...monthlyStatsQuery]);

  const dayOfWeekStatsStreams = await Stream.aggregate([...weekDayStatsQuery]);

  const dayOfWeekStatsSubs = await Subscriber.aggregate([...weekDayStatsQuery]);

  const timeOfDayStatsStreams = await Stream.aggregate([
    ...timeOfDayStatsQuery,
  ]);

  const timeOfDayStatsSubs = await Subscriber.aggregate([
    ...timeOfDayStatsQuery,
  ]);

  const topStreamersRes = topStreamers.map((topUser) => ({
    ...topUser,
    user: hideUserData(topUser.user, true),
  }));

  ctx.body = {
    totalDurationStreams,
    totalDurationSubs,
    avgStatsStreams,
    avgStatsSubs,
    topStreamers: topStreamersRes,
    monthlyStatsStreams,
    monthlyStatsSubs,
    dayOfWeekStatsStreams,
    dayOfWeekStatsSubs,
    timeOfDayStatsStreams,
    timeOfDayStatsSubs,
  };
}
