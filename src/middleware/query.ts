import { Next } from 'koa';
import * as Router from '@koa/router';
import _ from 'lodash';
import * as moment from 'moment';
import { strtotime } from 'locutus/php/datetime';

import { IP } from '../models/ip';

const filterRules: {
  [key: string]: {
    do: any[];
    test: any[];
    cb: (query: any, key: any) => void;
  };
} = {
  app: {
    do: [],
    test: [_.isString],
    cb: (query, app) => {
      query.app = new RegExp(app, 'gi');
    },
  },
  channel: {
    do: [],
    test: [_.isString],
    cb: (query, channel) => {
      query.channel = new RegExp(channel, 'gi');
    },
  },
  connectCreated: {
    do: [strtotime, moment.unix, (value: moment.Moment) => value.toDate()],
    test: [_.isDate],
    cb: (query, connectCreated) => {
      query.connectCreated = {
        $gte: connectCreated,
      };
    },
  },
  connectUpdated: {
    do: [strtotime, moment.unix, (value: moment.Moment) => value.toDate()],
    test: [_.isDate],
    cb: (query, connectUpdated) => {
      query.connectUpdated = {
        $gte: connectUpdated,
      };
    },
  },
  bytes: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: (query, bytes) => {
      query.bytes = {
        $gte: bytes * 1024 * 1024,
      };
    },
  },
  ip: {
    do: [],
    test: [_.isString],
    cb: async (query, ip) => {
      const ips = await IP.distinct<string>('ip', {
        $or: [
          { 'api.country': new RegExp(ip, 'gi') },
          { 'api.city': new RegExp(ip, 'gi') },
          { 'api.isp': new RegExp(ip, 'gi') },
          { 'api.countryCode': new RegExp(ip, 'gi') },
          { 'api.message': new RegExp(ip, 'gi') },
        ],
      });

      const subQuery: any[] = [];

      subQuery.push({ ip: { $in: ips } });

      subQuery.push({ ip: new RegExp(ip, 'gi') });

      query.$or = query;
    },
  },
  protocol: {
    do: [],
    test: [_.isString],
    cb: (query, protocol) => {
      query.protocol = new RegExp(protocol, 'gi');
    },
  },
  duration: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: (query, duration) => {
      query.duration = {
        $gte: duration * 60,
      };
    },
  },
  bitrate: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: (query, bitrate) => {
      query.bitrate = {
        $gte: bitrate,
      };
    },
  },
  totalConnectionsCount: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: (query, totalConnectionsCount) => {
      query.totalConnectionsCount = {
        $gte: totalConnectionsCount,
      };
    },
  },
  peakViewersCount: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: (query, peakViewersCount) => {
      query.peakViewersCount = {
        $gte: peakViewersCount,
      };
    },
  },
  createdAt: {
    do: [strtotime, moment.unix, (value: moment.Moment) => value.toDate()],
    test: [_.isDate],
    cb: (query, createdAt) => {
      query.createdAt = {
        $gte: createdAt,
      };
    },
  },
  'ip.ip': {
    do: [],
    test: [_.isString],
    cb: (query, ip) => {
      query['ip'] = new RegExp(ip, 'gi');
    },
  },
  'api.country': {
    do: [],
    test: [_.isString],
    cb: (query, country) => {
      query.$or = [
        { 'api.country': new RegExp(country, 'gi') },
        { 'api.message': new RegExp(country, 'gi') },
      ];
    },
  },
  'api.city': {
    do: [],
    test: [_.isString],
    cb: (query, city) => {
      query['api.city'] = new RegExp(city, 'gi');
    },
  },
  'api.isp': {
    do: [],
    test: [_.isString],
    cb: (query, isp) => {
      query['api.isp'] = new RegExp(isp, 'gi');
    },
  },
};

const rulePresets: {
  [key: string]: {
    [key: string]: (typeof filterRules)[0];
  };
} = {
  stream: {
    app: filterRules.app,
    channel: filterRules.channel,
    connectCreated: filterRules.connectCreated,
    connectUpdated: filterRules.connectUpdated,
    bytes: filterRules.bytes,
    // ip: filterRules.ip,
    protocol: filterRules.protocol,
    duration: filterRules.duration,
    bitrate: filterRules.bitrate,
    totalConnectionsCount: filterRules.totalConnectionsCount,
    peakViewersCount: filterRules.peakViewersCount,
  },
  subscriber: {
    app: filterRules.app,
    channel: filterRules.channel,
    connectCreated: filterRules.connectCreated,
    connectUpdated: filterRules.connectUpdated,
    bytes: filterRules.bytes,
    // ip: filterRules.ip,
    protocol: filterRules.protocol,
    duration: filterRules.duration,
    bitrate: filterRules.bitrate,
  },
  ip: {
    createdAt: filterRules.createdAt,
    ip: filterRules['ip.ip'],
    'api.country': filterRules['api.country'],
    'api.city': filterRules['api.city'],
    'api.isp': filterRules['api.isp'],
  },
};

export function parseFilter(entityName: string) {
  const rules = rulePresets[entityName];

  return async function (ctx: Router.RouterContext, next: Next) {
    const query: {} = {};

    await Promise.all(
      _.map(rules, async (rule, fieldName) => {
        if (!ctx.query.hasOwnProperty(fieldName)) {
          return;
        }

        try {
          let value = ctx.query[fieldName];

          _.forEach(rule.do, (fnc) => {
            value = fnc(value);
          });

          for (const fnc of rule.test) {
            if (!fnc(value)) {
              return;
            }
          }

          await rule.cb(query, value);
        } catch (e) {}
      }),
    );

    ctx.state.query = query;

    await next();
  };
}
