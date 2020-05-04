import { Next } from 'koa';
import * as Router from 'koa-router';
import * as _ from 'lodash';
import * as moment from 'moment';
import { strtotime } from 'locutus/php/datetime';

import { IP } from '../models/ip';
import { shouldHideFields } from '../helpers/should-hide-fields';

declare module 'koa-router' {
  interface IRouterContext {
    queryObj: any;
  }
}

const filterRules = {
  app: {
    do: [],
    test: [_.isString],
    cb: function(queryObj, app) {
      queryObj.app = new RegExp(app, 'gi');
    }
  },
  channel: {
    do: [],
    test: [_.isString],
    cb: function(queryObj, channel) {
      queryObj.channel = new RegExp(channel, 'gi');
    }
  },
  connectCreated: {
    do: [strtotime, moment.unix, value => value.toDate()],
    test: [_.isDate],
    cb: function(queryObj, connectCreated) {
      queryObj.connectCreated = {
        $gte: connectCreated
      };
    }
  },
  connectUpdated: {
    do: [strtotime, moment.unix, value => value.toDate()],
    test: [_.isDate],
    cb: function(queryObj, connectUpdated) {
      queryObj.connectUpdated = {
        $gte: connectUpdated
      };
    }
  },
  bytes: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: function(queryObj, bytes) {
      queryObj.bytes = {
        $gte: bytes * 1024 * 1024
      };
    }
  },
  ip: {
    do: [],
    test: [_.isString],
    cb: async function(queryObj, ip, ctx) {
      const ipQuery = [
        { 'api.country': new RegExp(ip, 'gi') },
        { 'api.city': new RegExp(ip, 'gi') },
        { 'api.isp': new RegExp(ip, 'gi') },
        { 'api.countryCode': new RegExp(ip, 'gi') },
        { 'api.message': new RegExp(ip, 'gi') }
      ];

      const ips = await IP.distinct('ip', {
        $or: ipQuery
      });

      const query: any[] = [];

      query.push({ ip: { $in: ips } });

      if (!shouldHideFields(ctx.state.user)) {
        query.push({ ip: new RegExp(ip, 'gi') });
      }

      queryObj.$or = query;
    }
  },
  protocol: {
    do: [],
    test: [_.isString],
    cb: function(queryObj, protocol) {
      queryObj.protocol = new RegExp(protocol, 'gi');
    }
  },
  duration: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: function(queryObj, duration) {
      queryObj.duration = {
        $gte: duration * 60
      };
    }
  },
  bitrate: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: function(queryObj, bitrate) {
      queryObj.bitrate = {
        $gte: bitrate
      };
    }
  },
  totalConnectionsCount: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: function(queryObj, totalConnectionsCount) {
      queryObj.totalConnectionsCount = {
        $gte: totalConnectionsCount
      };
    }
  },
  peakViewersCount: {
    do: [_.toNumber],
    test: [_.isFinite],
    cb: function(queryObj, peakViewersCount) {
      queryObj.peakViewersCount = {
        $gte: peakViewersCount
      };
    }
  },
  createdAt: {
    do: [strtotime, moment.unix, value => value.toDate()],
    test: [_.isDate],
    cb: function(queryObj, createdAt) {
      queryObj.createdAt = {
        $gte: createdAt
      };
    }
  },
  'ip.ip': {
    do: [],
    test: [_.isString],
    cb: function(queryObj, ip) {
      queryObj['ip'] = new RegExp(ip, 'gi');
    }
  },
  'api.country': {
    do: [],
    test: [_.isString],
    cb: function(queryObj, country) {
      queryObj.$or = [{ 'api.country': new RegExp(country, 'gi') }, { 'api.message': new RegExp(country, 'gi') }];
    }
  },
  'api.city': {
    do: [],
    test: [_.isString],
    cb: function(queryObj, city) {
      queryObj['api.city'] = new RegExp(city, 'gi');
    }
  },
  'api.isp': {
    do: [],
    test: [_.isString],
    cb: function(queryObj, isp) {
      queryObj['api.isp'] = new RegExp(isp, 'gi');
    }
  }
};

const rulePresets = {
  stream: {
    app: filterRules.app,
    channel: filterRules.channel,
    connectCreated: filterRules.connectCreated,
    connectUpdated: filterRules.connectUpdated,
    bytes: filterRules.bytes,
    ip: filterRules.ip,
    protocol: filterRules.protocol,
    duration: filterRules.duration,
    bitrate: filterRules.bitrate,
    totalConnectionsCount: filterRules.totalConnectionsCount,
    peakViewersCount: filterRules.peakViewersCount
  },
  subscriber: {
    app: filterRules.app,
    channel: filterRules.channel,
    connectCreated: filterRules.connectCreated,
    connectUpdated: filterRules.connectUpdated,
    bytes: filterRules.bytes,
    ip: filterRules.ip,
    protocol: filterRules.protocol,
    duration: filterRules.duration,
    bitrate: filterRules.bitrate
  },
  ip: {
    createdAt: filterRules.createdAt,
    ip: filterRules['ip.ip'],
    'api.country': filterRules['api.country'],
    'api.city': filterRules['api.city'],
    'api.isp': filterRules['api.isp']
  }
};

export function parseFilter(modelName) {
  const rules = rulePresets?.[modelName];

  return async function(ctx: Router.IRouterContext, next: Next) {
    const queryObj: any = {};

    await Promise.all(
      _.map(rules, async (rule, fieldName) => {
        if (!ctx.query.hasOwnProperty(fieldName)) {
          return;
        }

        try {
          let value = ctx.query[fieldName];

          _.forEach(rule.do, fnc => {
            value = fnc(value);
          });

          for (const fnc of rule.test) {
            if (!fnc(value)) {
              return;
            }
          }

          await rule.cb(queryObj, value, ctx);
        } catch (e) {}
      })
    );

    ctx.queryObj = queryObj;

    next();
  };
}
