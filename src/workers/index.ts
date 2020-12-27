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

export const STREAM_SERVERS = AMS.concat(NMS);

export const liveStats: ILiveStats = {};
