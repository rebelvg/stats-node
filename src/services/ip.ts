import axios from 'axios';

import { IIPModel, IP } from '../models/ip';

const apiLink = `http://ip-api.com/json`;

class IPService {
  public async upsert(ip: string) {
    const currentTime = new Date();

    const ipRecord = await IP.findOne({ ip });

    if (ipRecord) {
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

    if (!ipRecord) {
      await IP.create({
        api: data,
        createdAt: currentTime,
        updatedAt: currentTime,
        apiUpdatedAt: currentTime,
        isLocked: false,
        ip,
      });

      return;
    }

    await IP.updateOne(
      { _id: ipRecord._id },
      {
        api: data,
      },
    );
  }
}

export const ipService = new IPService();
