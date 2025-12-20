import _ from 'lodash';
import { ObjectId, WithId } from 'mongodb';
import * as ip6addr from 'ip6addr';

import { logger } from '../helpers/logger';
import { Stream } from '../models/stream';
import { ISubscriberModel, Subscriber } from '../models/subscriber';
import { streamService } from '../services/stream';
import { ipService } from '../services/ip';
import { subscriberService } from '../services/subscriber';
import { IWorkerApiBase } from '../env';
import { EnumProtocols } from '../helpers/interfaces';

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
      protocol: EnumProtocols;
      userId: string | null;
    } | null;
    subscribers: {
      connectId: string;
      connectCreated: Date;
      connectUpdated: Date;
      bytes: number;
      ip: string;
      protocol: EnumProtocols;
      userId: string | null;
    }[];
  }[];
}

export abstract class BaseWorker {
  private className: string;
  private requestCount = 0;

  constructor() {
    this.className = this.constructor.name;
  }

  abstract getStats(
    origin: string,
    secret: string,
  ): Promise<IGenericStreamsResponse[]>;

  public async runUpdate(servers: IWorkerApiBase[]) {
    await Promise.all(
      servers.map(async (config) => {
        try {
          await this.readStats(config);
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            logger.error('update_econnrefused', {
              error,
              source: this.className,
            });

            return;
          }

          logger.error('update_error', {
            error,
            source: this.className,
          });
        }
      }),
    );
  }

  public async run(WORKER_CONFIG: IWorkerApiBase[]) {
    logger.info('worker_running', {
      source: this.className,
    });

    while (true) {
      await this.runUpdate(WORKER_CONFIG);

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  public async processStats(
    streams: IGenericStreamsResponse[],
    protocols: IWorkerApiBase['PROTOCOLS'],
  ) {
    _.forEach(streams, (stream) => {
      stream.app = stream.app.toLowerCase();

      _.forEach(stream.channels, (channel) => {
        channel.channel = channel.channel.toLowerCase();
      });
    });

    for (const { channels, app } of streams) {
      for (const { channel, publisher, subscribers } of channels) {
        let streamId: ObjectId | null = null;

        if (publisher) {
          const server = protocols[publisher.protocol]?.origin;

          if (!server) {
            logger.warn('no_server', [protocols, publisher.protocol]);

            continue;
          }

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
            server,
            app,
            channel,
            connectId,
            connectCreated,
            protocol,
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
              userId: userId ? new ObjectId(userId) : null,
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
        const newSubscribers: WithId<ISubscriberModel>[] = [];

        for (const subscriber of subscribers) {
          const server = protocols[subscriber.protocol]?.origin;

          if (!server) {
            logger.warn('no_server', [protocols, subscriber.protocol]);

            continue;
          }

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
            server,
            app,
            channel,
            connectId,
            connectCreated,
            protocol,
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
              userId: userId ? new ObjectId(userId) : null,
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
            streamService.countViewersById(allSubscribers);

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

    return;
  }

  private async readStats(service: IWorkerApiBase) {
    let data: IGenericStreamsResponse[] = [];

    try {
      data = await this.getStats(service.API_ORIGIN, service.API_SECRET);
    } catch (error) {
      this.requestCount++;

      if (this.requestCount > 10) {
        this.requestCount = 0;

        return {};
      }

      throw error;
    }

    return this.processStats(data, service.PROTOCOLS);
  }
}
