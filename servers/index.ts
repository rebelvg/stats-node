import { IStreamModel } from '../models/stream';
import { ISubscriberModel } from '../models/subscriber';

export interface IStream {
  publisher: IStreamModel;
  subscribers: ISubscriberModel[];
}

export interface ILiveStats {
  [key: string]: {
    [key: string]: {
      [key: string]: IStream;
    };
  };
}

export const liveStats: ILiveStats = {};

import './ams';
import './nms';
