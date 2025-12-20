import Router from '@koa/router';

import { Stream } from '../models/stream';
import { Subscriber } from '../models/subscriber';
import _ from 'lodash';
import { User } from '../models/user';
import { ObjectId } from 'mongodb';

import { channelService } from '../services/channel';
import { ChannelTypeEnum } from '../models/channel';
import { generateURLs } from '../helpers/functions';
import { EnumProtocols } from '../helpers/interfaces';
import { WEB_DEFAULT_APP } from '../config';

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
        connectCreated: 1,
        protocol: -1,
      },
    },
  );

  const subscriberRecordAll = await Subscriber.find(
    {
      connectUpdated: {
        $gt: lastTimestamp,
      },
      streamIds: {
        $in: streamRecordsAll.map((s) => s._id),
      },
    },
    {
      sort: {
        connectCreated: 1,
      },
    },
  );

  const userRecordsAll = await User.find({
    _id: {
      $in: streamRecordsAll.map((s) => s.userId!),
    },
  });

  const channelNames = _.chain(streamRecordsAll)
    .map((s) => s.channel)
    .uniq()
    .value();

  const channels = await Promise.all(
    channelNames.map(async (channel) => {
      const streamRecords = _.filter(streamRecordsAll, { channel });

      return {
        streams: await Promise.all(
          streamRecords.map((stream) => {
            const userRecord = _.find(
              userRecordsAll,
              (u) => u._id.toString() === stream.userId?.toString(),
            );

            const subscribers = _.filter(subscriberRecordAll, (s) =>
              s.streamIds
                .map((id) => id.toString())
                .includes(stream._id.toString()),
            );

            return {
              ...stream,
              userName: userRecord?.name || null,
              subscribers,
            };
          }),
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
        connectCreated: 1,
        protocol: -1,
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

        const subscribers = await Subscriber.find({
          streamIds: {
            $in: [_id],
          },
          connectUpdated: {
            $gte: lastTimestamp,
          },
        });

        const encodeClients = _.filter(streamRecords, (s) => {
          return (
            s.app === app &&
            s.channel === channel &&
            ([EnumProtocols.HLS, EnumProtocols.MPD].includes(s.protocol) ||
              s.channel !== WEB_DEFAULT_APP)
          );
        });

        let viewers = subscribers.length;

        if (protocol === EnumProtocols.RTMP && encodeClients.length > 0) {
          viewers -= 1;
        }

        return {
          isLive: true,
          _id,
          name: channel,
          app,
          viewers: Math.max(viewers, 0),
          duration,
          bitrate,
          lastBitrate,
          startTime: connectCreated,
          protocol,
          userName: userRecord?.name || null,
          origin: server,
          urls: generateURLs({
            channel,
            app,
            protocol,
            origin: server,
          }),
        };
      },
    ),
  );

  ctx.body = {
    streams,
  };
});
