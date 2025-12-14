import _ from 'lodash';
import { ObjectId } from 'mongodb';

import { ILiveStats, LIVE_STATS_CACHE } from '.';
import { IWorkerConfig } from '../config';
import { logger } from '../helpers/logger';
import { IStreamModel, Stream } from '../models/stream';
import { ISubscriberModel, Subscriber } from '../models/subscriber';
import { channelService } from '../services/channel';
import { streamService } from '../services/stream';

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
      userId: ObjectId;
    };
    subscribers: {
      connectId: string;
      connectCreated: Date;
      connectUpdated: Date;
      bytes: number;
      ip: string;
      protocol: string;
      userId: ObjectId;
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
          const stats = await this.readStats(
            config.API_ORIGIN,
            config.API_SECRET,
          );

          _.set(LIVE_STATS_CACHE, [config.API_ORIGIN], stats);
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

  public async processStats(data: IGenericStreamsResponse[], host: string) {
    _.forEach(data, (channelObjs) => {
      channelObjs.app = channelObjs.app.toLowerCase();

      _.forEach(channelObjs.channels, (channelData) => {
        channelData.channel = channelData.channel.toLowerCase();
      });
    });

    const stats: ILiveStats[0] = {};

    const statsUpdateTime = new Date();

    for (const channelObjs of data) {
      const { app: appName } = channelObjs;

      for (const channelData of channelObjs.channels) {
        const { channel: channelName } = channelData;

        _.set(stats, [appName, channelName], {
          publisher: null,
          subscribers: [],
        });

        let streamRecord: IStreamModel = null;

        if (channelData.publisher) {
          const streamQuery = {
            server: host,
            app: appName,
            channel: channelName,
            connectId: channelData.publisher.connectId,
            connectCreated: channelData.publisher.connectCreated,
          };

          streamRecord = await Stream.findOne(streamQuery);

          if (!streamRecord) {
            streamRecord = {
              ...streamQuery,
              connectUpdated: statsUpdateTime,
              bytes: channelData.publisher.bytes,
              ip: channelData.publisher.ip,
              protocol: channelData.publisher.protocol,
              userId: channelData.publisher.userId,
              lastBitrate: 0,
              duration: 0,
              bitrate: 0,
              totalConnectionsCount: 0,
              peakViewersCount: 0,
              apiSource: this.apiSource,
              apiResponse: channelData.publisher,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          } else {
            const lastBitrate = streamService.calculateLastBitrate(
              channelData.publisher.bytes,
              streamRecord.bytes,
              statsUpdateTime,
              streamRecord.connectUpdated,
            );

            streamRecord.lastBitrate = lastBitrate;
            streamRecord.bytes = channelData.publisher.bytes;
            streamRecord.connectUpdated = statsUpdateTime;
            streamRecord.apiSource = this.apiSource;
            streamRecord.apiResponse = channelData.publisher;
          }
        }

        for (const subscriber of channelData.subscribers) {
          const subscriberQuery = {
            server: host,
            app: appName,
            channel: channelName,
            connectId: subscriber.connectId,
            connectCreated: subscriber.connectCreated,
          };

          let subscriberRecord: ISubscriberModel =
            await Subscriber.findOne(subscriberQuery);

          if (!subscriberRecord) {
            subscriberRecord = {
              ...subscriberQuery,
              connectUpdated: statsUpdateTime,
              bytes: subscriber.bytes,
              ip: subscriber.ip,
              protocol: subscriber.protocol,
              userId: subscriber.userId,
              duration: 0,
              bitrate: 0,
              streamIds: [],
              apiSource: this.apiSource,
              apiResponse: subscriber,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          } else {
            subscriberRecord.bytes = subscriber.bytes;
            subscriberRecord.connectUpdated = statsUpdateTime;
          }

          if (streamRecord) {
            const streamIds = subscriberRecord.streamIds;

            streamIds.push(streamRecord._id);

            subscriberRecord.streamIds = _.uniqBy(streamIds, (item) =>
              item.toHexString(),
            );
          }

          subscriberRecord.apiSource = this.apiSource;
          subscriberRecord.apiResponse = subscriber;

          await Subscriber.upsert(subscriberRecord);

          stats[appName][channelName].subscribers.push(subscriberRecord);
        }

        if (streamRecord) {
          const streamViewers = await streamService.countViewersById(
            streamRecord._id,
          );

          streamRecord.totalConnectionsCount =
            streamViewers.totalConnectionsCount;
          streamRecord.peakViewersCount = streamViewers.peakViewersCount;

          await Stream.upsert(streamRecord);

          await channelService.addChannel(streamRecord.channel);
        }

        _.set(stats, [appName, channelName, 'publisher'], streamRecord);
      }
    }

    return stats;
  }

  private async readStats(origin: string, secret: string) {
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

    const { host } = new URL(origin);

    return this.processStats(data, host);
  }
}
