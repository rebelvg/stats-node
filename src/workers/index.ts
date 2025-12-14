import _ from 'lodash';

import { IStreamModel } from '../models/stream';
import { ISubscriberModel } from '../models/subscriber';
import { WithId } from 'mongodb';

export interface IStream {
  publisher: WithId<IStreamModel> | null;
  subscribers: WithId<ISubscriberModel>[];
}

export interface ILiveStats {
  [server: string]: {
    [app: string]: {
      [channel: string]: IStream | null;
    } | null;
  } | null;
}

export const LIVE_STATS_CACHE: ILiveStats = {};
