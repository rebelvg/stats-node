import Router from '@koa/router';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import _ from 'lodash';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';

import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { env } from '../env';

export const router = new Router();

router.get('/', async (ctx) => {
  const isAdmin = !!ctx.state.user?.isAdmin;

  const channelsPublic = await channelService.getChannelsByType(
    ChannelTypeEnum.PUBLIC,
  );

  const channelNamesPublic = channelsPublic.map((c) => c.name);

  const lastTimestamp = new Date(Date.now() - 30 * 1000);

  const streamRecordsAll = await Stream.find(
    {
      connectUpdated: {
        $gt: lastTimestamp,
      },
      channel: !isAdmin
        ? {
            $in: channelNamesPublic,
          }
        : {
            $exists: true,
          },
    },
    {
      sort: {
        connectCreated: -1,
      },
    },
  );

  const channelNames = _.chain(streamRecordsAll)
    .map((s) => s.channel)
    .uniq()
    .value();

  const channels = await Promise.all(
    channelNames.map(async (channel) => {
      const streamRecords = _.filter(streamRecordsAll, { channel });

      return {
        streams: await Promise.all(
          streamRecords.map(
            async ({
              _id,
              duration,
              bitrate,
              lastBitrate,
              connectCreated,
              app,
              server,
              userId,
              protocol,
            }) => {
              const userRecord = userId
                ? await User.findOne({
                    _id: new ObjectId(userId),
                  })
                : null;

              const subscribers = await Subscriber.find({
                streamIds: {
                  $in: [_id],
                },
                connectUpdated: {
                  $gte: lastTimestamp,
                },
              });

              const protocols: { name: string; origin: string }[] = [];

              for (const { API_ORIGIN, PROTOCOLS } of env.SERVICES) {
                if (new URL(API_ORIGIN).host === server) {
                  for (const { apps, ...rest } of PROTOCOLS) {
                    if (apps.includes(app)) {
                      protocols.push(rest);
                    }
                  }
                }
              }

              return {
                isLive: true,
                _id,
                name: channel,
                app,
                viewers: subscribers.length,
                duration,
                bitrate,
                lastBitrate,
                startTime: connectCreated,
                protocol,
                userName: userRecord?.name || null,
                protocols,
              };
            },
          ),
        ),
      };
    }),
  );

  ctx.body = {
    channels,
  };
});

router.get('/:channel', async (ctx) => {
  const { channel } = ctx.params;

  const lastTimestamp = new Date(Date.now() - 30 * 1000);

  const streamRecords = await Stream.find(
    {
      channel,
      connectUpdated: {
        $gt: lastTimestamp,
      },
    },
    {
      sort: {
        connectCreated: -1,
      },
    },
  );

  const streams = await Promise.all(
    streamRecords.map(
      async ({
        _id,
        duration,
        bitrate,
        lastBitrate,
        connectCreated,
        app,
        server,
        userId,
        protocol,
      }) => {
        const userRecord = userId
          ? await User.findOne({
              _id: new ObjectId(userId),
            })
          : null;

        const protocols: { name: string; origin: string }[] = [];

        for (const { API_ORIGIN, PROTOCOLS } of env.SERVICES) {
          if (new URL(API_ORIGIN).host === server) {
            for (const { apps, ...rest } of PROTOCOLS) {
              if (apps.includes(app)) {
                protocols.push(rest);
              }
            }
          }
        }

        const subscribers = await Subscriber.find({
          streamIds: {
            $in: [_id],
          },
          connectUpdated: {
            $gte: lastTimestamp,
          },
        });

        return {
          isLive: true,
          _id,
          name: channel,
          app,
          viewers: subscribers.length,
          duration,
          bitrate,
          lastBitrate,
          startTime: connectCreated,
          protocol,
          userName: userRecord?.name || null,
          protocols,
        };
      },
    ),
  );

  ctx.body = {
    streams,
  };
});
