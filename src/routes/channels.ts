import Router from '@koa/router';

import { isAdmin } from '../middleware/is-admin';
import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import _ from 'lodash';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';

export const router = new Router();

router.get('/', isAdmin, async (ctx) => {
  const lastTimestamp = new Date(Date.now() - 30 * 1000);

  const channelNames = await Stream.distinct<string>('channel', {});

  const channels = await Promise.all(
    channelNames.map(async (channel) => {
      const streamRecords = await Stream.find(
        {
          channel,
          connectUpdated: {
            $gte: lastTimestamp,
          },
        },
        {
          sort: {
            connectCreated: -1,
          },
        },
      );

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

              return {
                isLive: true,
                _id,
                app,
                server,
                viewers: subscribers.length,
                duration,
                bitrate,
                lastBitrate,
                startTime: connectCreated,
                name: userRecord?.name || null,
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
        $gte: lastTimestamp,
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

        return {
          isLive: true,
          _id,
          app,
          server,
          viewers: subscribers.length,
          duration,
          bitrate,
          lastBitrate,
          startTime: connectCreated,
          name: userRecord?.name || null,
        };
      },
    ),
  );

  ctx.body = {
    streams,
  };
});
