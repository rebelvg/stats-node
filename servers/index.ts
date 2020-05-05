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

export const liveStats: ILiveStats = {};

import './ams';
import './nms';
