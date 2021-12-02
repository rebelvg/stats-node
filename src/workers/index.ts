import * as _ from 'lodash';

import {
  KLPQ_MEDIA_SERVER,
  NODE_MEDIA_SERVER,
  ADOBE_MEDIA_SERVER,
  ENCODE_SERVICE,
} from '../config';
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

export const STREAM_SERVERS = [
  ...KLPQ_MEDIA_SERVER,
  ...NODE_MEDIA_SERVER,
  ...ADOBE_MEDIA_SERVER,
  ...ENCODE_SERVICE,
];

export const liveStats: ILiveStats = {};
