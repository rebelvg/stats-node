import _ from 'lodash';
import { ObjectId, WithId } from 'mongodb';
import * as ip6addr from 'ip6addr';

import { ILiveStats, LIVE_STATS_CACHE } from '.';
import { IWorkerConfig } from '../config';
import { logger } from '../helpers/logger';
import { IStreamModel, Stream } from '../models/stream';
import { ISubscriberModel, Subscriber } from '../models/subscriber';
import { channelService } from '../services/channel';
import { streamService } from '../services/stream';
import { ipService } from '../services/ip';
import { subscriberService } from '../services/subscriber';

export interface IGenericStreamsResponse {
  app: string;
  channels: {
    channel: string;
    publisher: {
      connectId: string;
      connectCreated: Date;
      connectUpdated: Date;
      bytes: number;
      ip: string;
      protocol: string;
      userId: ObjectId | null;
    } | null;
    subscribers: {
      connectId: string;
      connectCreated: Date;
      connectUpdated: Date;
      bytes: number;
      ip: string;
      protocol: string;
      userId: ObjectId | null;
    }[];
  }[];
}

export abstract class BaseWorker {
  private apiSource: string;
  private requestCount = 0;

  constructor() {
    this.apiSource = this.constructor.name;
  }

  abstract getStats(
    origin: string,
    secret: string,
  ): Promise<IGenericStreamsResponse[]>;

  public async runUpdate(servers: IWorkerConfig[]) {
    await Promise.all(
      servers.map(async (config) => {
        try {
          const { host } = new URL(config.API_ORIGIN);

          const stats = await this.readStats(
            config.API_ORIGIN,
            config.API_SECRET,
            host,
          );

          _.set(LIVE_STATS_CACHE, [host], stats);
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            logger.error('update_econnrefused', {
              error,
              source: this.apiSource,
            });

            return;
          }

          logger.error('update_error', {
            error,
            source: this.apiSource,
          });
        }
      }),
    );
  }

  public async run(WORKER_CONFIG: IWorkerConfig[]) {
    logger.info('worker_running', {
      source: this.apiSource,
    });

    // eslint-disable-next-line no-constant-condition
    while (true) {
      await this.runUpdate(WORKER_CONFIG);

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  public async processStats(streams: IGenericStreamsResponse[], host: string) {
    _.forEach(streams, (stream) => {
      stream.app = stream.app.toLowerCase();

      _.forEach(stream.channels, (channel) => {
        channel.channel = channel.channel.toLowerCase();
      });
    });

    const stats: ILiveStats[0] = {};

    const statsUpdateTime = new Date();

    for (const { channels, app } of streams) {
      for (const { channel, publisher, subscribers } of channels) {
        if (!stats[app]) {
          stats[app] = {};
        }

        if (!stats[app][channel]) {
          stats[app][channel] = {
            publisher: null,
            subscribers: [],
          };
        }

        let streamId: ObjectId | null = null;

        if (publisher) {
          const {
            connectId,
            connectCreated,
            connectUpdated,
            bytes,
            protocol,
            userId,
            ip,
          } = publisher;

          const duration = Math.ceil(
            (connectUpdated.valueOf() - connectCreated.valueOf()) / 1000,
          );
          const bitrate =
            duration > 0 ? Math.ceil((bytes * 8) / duration / 1024) : 0;

          const streamQuery = {
            server: host,
            app,
            channel,
            connectId,
            connectCreated,
          };

          const streamRecord = await Stream.findOne(streamQuery);

          if (!streamRecord) {
            const addr = ip6addr.parse(ip);

            const sanitizedIp =
              addr.kind() === 'ipv6'
                ? addr.toString({ format: 'v6' })
                : addr.toString({ format: 'v4' });

            const { insertedId } = await Stream.create({
              ...streamQuery,
              protocol,
              userId,
              ip: sanitizedIp,

              connectUpdated,
              bytes,
              duration,
              bitrate,

              lastBitrate: bitrate,
              totalConnectionsCount: 0,
              peakViewersCount: 0,
            });

            streamId = insertedId;

            ipService.upsert(sanitizedIp).catch((error) =>
              logger.error('stream_failed_to_save_ip', {
                error,
              }),
            );
          } else {
            streamId = streamRecord._id;

            const lastBitrate = streamService.calculateLastBitrate(
              { now: bytes, last: streamRecord.bytes },
              { now: connectUpdated, last: streamRecord.connectUpdated },
            );

            await Stream.updateOne(
              {
                _id: streamRecord._id,
              },
              {
                connectUpdated,
                bytes,
                duration,
                bitrate,

                lastBitrate,
              },
            );
          }
        }

        const lastSubscribers = streamId
          ? await subscriberService.getByStreamId(streamId, {})
          : [];
        const newSubscribers: ISubscriberModel[] = [];

        for (const subscriber of subscribers) {
          const {
            connectId,
            connectCreated,
            connectUpdated,
            bytes,
            protocol,
            userId,
            ip,
          } = subscriber;

          const duration = Math.ceil(
            (connectUpdated.valueOf() - connectCreated.valueOf()) / 1000,
          );
          const bitrate =
            duration > 0 ? Math.ceil((bytes * 8) / duration / 1024) : 0;

          const subscriberQuery = {
            server: host,
            app,
            channel,
            connectId,
            connectCreated,
          };

          const subscriberRecord = await Subscriber.findOne(subscriberQuery);

          if (!subscriberRecord) {
            const addr = ip6addr.parse(ip);

            const sanitizedIp =
              addr.kind() === 'ipv6'
                ? addr.toString({ format: 'v6' })
                : addr.toString({ format: 'v4' });

            const newSubscriber = await Subscriber.create({
              ...subscriberQuery,
              protocol,
              userId,
              ip: sanitizedIp,

              connectUpdated,
              bytes,
              duration,
              bitrate,

              streamIds: [],
            });

            newSubscribers.push(newSubscriber);

            ipService.upsert(sanitizedIp).catch((error) =>
              logger.error('stream_failed_to_save_ip', {
                error,
              }),
            );
          } else {
            await Subscriber.updateOne(
              {
                _id: subscriberRecord._id,
              },
              {
                connectUpdated,
                bytes,
                duration,
                bitrate,
              },
            );
          }
        }

        if (streamId) {
          const allSubscribers = [...lastSubscribers, ...newSubscribers];

          await Promise.all(
            allSubscribers.map(async (subscriber) => {
              if (
                !subscriber.streamIds.find(
                  (streamId) => streamId.toString() === streamId.toString(),
                )
              ) {
                await Subscriber.updateOne(
                  {
                    _id: subscriber._id,
                  },
                  {
                    streamIds: [...subscriber.streamIds, streamId],
                  },
                );
              }
            }),
          );

          const { peakViewersCount, totalConnectionsCount } =
            await streamService.countViewersById(allSubscribers);

          await Stream.updateOne(
            {
              _id: streamId,
            },
            {
              peakViewersCount,
              totalConnectionsCount,
            },
          );
        }
      }
    }

    return stats;
  }

  private async readStats(origin: string, secret: string, host: string) {
    let data: IGenericStreamsResponse[] = [];

    try {
      data = await this.getStats(origin, secret);
    } catch (error) {
      this.requestCount++;

      if (this.requestCount > 10) {
        this.requestCount = 0;

        return {};
      }

      throw error;
    }

    return this.processStats(data, host);
  }
}
