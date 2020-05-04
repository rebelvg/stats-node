import { IStreamModel } from '../models/stream';
import { ISubscriberModel } from '../models/subscriber';

export interface IStream {
  publisher: IStreamModel;
  subscribers: ISubscriberModel[];
}

export interface ILiveStats {
  [server: string]: {
    [app: string]: {
      [channel: string]: IStream;
    };
  };
}

export const liveStats: ILiveStats = {};

import './ams';
import './nms';
