export interface IStream {
  publisher: any;
  subscribers: any[];
}

export interface ILiveStats {
  [key: string]: IStream;
}

export const liveStats: ILiveStats = {};

import './ams';
import './nms';
