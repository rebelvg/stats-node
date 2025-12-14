import axios from 'axios';

import { IIPModel, IP } from '../models/ip';

const apiLink = `http://ip-api.com/json`;

class IPService {
  public async upsert(ip: string) {
    const currentTime = new Date();

    let ipRecord = await IP.findOne({ ip });

    if (!ipRecord) {
      ipRecord = await IP.create({
        api: null,
        apiUpdatedAt: currentTime,
        isLocked: false,
        ip,
      });
    } else {
      if (ipRecord.isLocked) {
        return;
      }

      const isRecordMonthOld =
        currentTime.valueOf() - ipRecord.apiUpdatedAt.valueOf() >
        30 * 24 * 60 * 60 * 1000;

      if (!isRecordMonthOld) {
        return;
      }
    }

    const { data } = await axios.get<IIPModel['api']>(`${apiLink}/${ip}`);

    await IP.updateOne(
      { _id: ipRecord._id },
      {
        api: data,
        apiUpdatedAt: currentTime,
      },
    );
  }
}

export const ipService = new IPService();
