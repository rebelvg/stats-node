import * as _ from 'lodash';
import { ObjectId } from 'mongodb';

import { ILiveStats, liveStats } from '.';
import { IWorkerConfig } from '../config';
import { IStreamModel, Stream } from '../models/stream';
import { ISubscriberModel, Subscriber } from '../models/subscriber';
import { streamService } from '../services/stream';

export interface IGenericStreamsResponse {
  [app: string]: {
    [channel: string]: {
      publisher: {
        app: string;
        channel: string;
        connectId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        userId: ObjectId;
      };
      subscribers: {
        app: string;
        channel: string;
        connectId: string;
        connectCreated: Date;
        bytes: number;
        ip: string;
        protocol: string;
        userId: ObjectId;
      }[];
    };
  };
}

export abstract class BaseWorker {
  abstract getStats(
    API_HOST: string,
    API_TOKEN: string,
  ): Promise<IGenericStreamsResponse>;

  public async runUpdate(NMS: IWorkerConfig[]) {
    await Promise.all(
      NMS.map(async (nmsConfig) => {
        try {
          const { NAME } = nmsConfig;

          const stats = await this.readStats(nmsConfig);

          _.set(liveStats, [NAME], stats);
        } catch (error) {
          if (error.code === 'ECONNREFUSED') {
            console.log('nms_update_econnrefused', error.message);

            return;
          }

          console.log('nms_update_error', error);
        }
      }),
    );
  }

  private async readStats(config: IWorkerConfig) {
    const { NAME, API_HOST, API_TOKEN } = config;

    const data = await this.getStats(API_HOST, API_TOKEN);

    const stats: ILiveStats[0] = {};

    const statsUpdateTime = new Date();

    await Promise.all(
      _.map(data, (channelObjs, appName) => {
        return Promise.all(
          _.map(channelObjs, async (channelData, channelName) => {
            _.set(stats, [appName, channelName], {
              publisher: null,
              subscribers: [],
            });

            let streamRecord: IStreamModel = null;

            if (channelData.publisher) {
              const streamQuery: Partial<IStreamModel> = {
                server: NAME,
                app: channelData.publisher.app,
                channel: channelData.publisher.channel,
                connectId: channelData.publisher.connectId,
                connectCreated: channelData.publisher.connectCreated,
              };

              streamRecord = await Stream.findOne(streamQuery);

              if (!streamRecord) {
                streamQuery.connectUpdated = statsUpdateTime;
                streamQuery.bytes = channelData.publisher.bytes;
                streamQuery.ip = channelData.publisher.ip;
                streamQuery.protocol = 'rtmp';
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
              }
            }

            for (const subscriber of channelData.subscribers) {
              const subscriberQuery: Partial<ISubscriberModel> = {
                server: NAME,
                app: subscriber.app,
                channel: subscriber.channel,
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
            }

            _.set(stats, [appName, channelName, 'publisher'], streamRecord);
          }),
        );
      }),
    );

    return stats;
  }
}
