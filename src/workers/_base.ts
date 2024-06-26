import * as _ from 'lodash';
import { ObjectId } from 'mongodb';
import { FilterQuery } from 'mongoose';

import { ILiveStats, liveStats } from '.';
import { IWorkerConfig } from '../config';
import { logger } from '../helpers/logger';
import { ApiSourceEnum, IStreamModel, Stream } from '../models/stream';
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
  abstract apiSource: ApiSourceEnum;
  private requestCount = 0;

  abstract getStats(config: IWorkerConfig): Promise<IGenericStreamsResponse[]>;

  public async runUpdate(servers: IWorkerConfig[]) {
    await Promise.all(
      servers.map(async (config) => {
        try {
          const { NAME } = config;

          const stats = await this.readStats(config);

          _.set(liveStats, [NAME], stats);
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

  private async readStats(config: IWorkerConfig) {
    const { NAME } = config;

    let data: IGenericStreamsResponse[] = [];

    try {
      data = await this.getStats(config);
    } catch (error) {
      this.requestCount++;

      if (this.requestCount > 10) {
        this.requestCount = 0;

        return {};
      }

      throw error;
    }

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
          const streamQuery: FilterQuery<IStreamModel> = {
            server: NAME,
            app: appName,
            channel: channelName,
            connectId: channelData.publisher.connectId,
            connectCreated: channelData.publisher.connectCreated,
          };

          streamRecord = await Stream.findOne(streamQuery);

          if (!streamRecord) {
            streamQuery.connectUpdated = statsUpdateTime;
            streamQuery.bytes = channelData.publisher.bytes;
            streamQuery.ip = channelData.publisher.ip;
            streamQuery.protocol = channelData.publisher.protocol;
            streamQuery.userId = channelData.publisher.userId;
            streamQuery.lastBitrate = 0;

            streamRecord = new Stream(streamQuery);
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
          const subscriberQuery: FilterQuery<ISubscriberModel> = {
            server: NAME,
            app: appName,
            channel: channelName,
            connectId: subscriber.connectId,
            connectCreated: subscriber.connectCreated,
          };

          let subscriberRecord = await Subscriber.findOne(subscriberQuery);

          if (!subscriberRecord) {
            subscriberQuery.connectUpdated = statsUpdateTime;
            subscriberQuery.bytes = subscriber.bytes;
            subscriberQuery.ip = subscriber.ip;
            subscriberQuery.protocol = subscriber.protocol;
            subscriberQuery.userId = subscriber.userId;

            subscriberRecord = new Subscriber(subscriberQuery);
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

          await subscriberRecord.save();

          stats[appName][channelName].subscribers.push(subscriberRecord);
        }

        if (streamRecord) {
          const streamViewers = await streamService.countViewersById(
            streamRecord._id,
          );

          streamRecord.totalConnectionsCount =
            streamViewers.totalConnectionsCount;
          streamRecord.peakViewersCount = streamViewers.peakViewersCount;

          await streamRecord.save();

          await channelService.addChannel(streamRecord.channel);
        }

        _.set(stats, [appName, channelName, 'publisher'], streamRecord);
      }
    }

    return stats;
  }
}
