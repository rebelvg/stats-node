import * as _ from 'lodash';
import { NODE_MEDIA_SERVER } from '../config';
import { ApiSourceEnum } from '../models/stream';

import { BaseWorker, IGenericStreamsResponse } from './_base';

class MediaServerWorker extends BaseWorker {
  apiSource = ApiSourceEnum.NODE_MEDIA_SERVER;

  getStats(): Promise<IGenericStreamsResponse[]> {
    throw 'not_implemented';
  }
}

export async function runUpdate() {
  const mediaServerWorker = new MediaServerWorker();

  await mediaServerWorker.run(NODE_MEDIA_SERVER);
}
