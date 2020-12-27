import * as _ from 'lodash';

import { AMS, NMS } from '../config';
import { IStreamModel } from '../models/stream';
import { ISubscriberModel } from '../models/subscriber';

export interface IStream {
  readonly publisher: IStreamModel;
  readonly subscribers: ISubscriberModel[];
}

export interface ILiveStats {
  readonly [server: string]: {
    readonly [app: string]: {
      readonly [channel: string]: IStream;
    };
  };
}

export interface IWorkerConfig {
  NAME: string;
  HOSTS: string[];
  API_HOST: string;
  API_TOKEN: string;
}

export const STREAM_SERVERS: IWorkerConfig[] = AMS.concat(NMS);

export const liveStats: ILiveStats = {};

import './ams';
import './nms';
