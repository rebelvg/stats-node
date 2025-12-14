import _ from 'lodash';

import { IStreamModel } from '../models/stream';
import { ISubscriberModel } from '../models/subscriber';
import { WithId } from 'mongodb';

export interface IStream {
  readonly publisher: WithId<IStreamModel>;
  readonly subscribers: WithId<ISubscriberModel>[];
}

export interface ILiveStats {
  readonly [server: string]: {
    readonly [app: string]: {
      readonly [channel: string]: IStream;
    };
  };
}

export const LIVE_STATS_CACHE: ILiveStats = {};
