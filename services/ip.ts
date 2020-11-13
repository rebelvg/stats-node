import axios from 'axios';

import { IP } from '../models/ip';

const apiLink = `http://ip-api.com/json`;

class IpService {
  public async upsert(ip: string) {
    const currentTime = new Date();

    const ipRecord = await IP.findOne({ ip });

    if (!ipRecord) {
      const { data } = await axios.get(`${apiLink}/${ip}`);

      await IP.updateOne(
        { ip },
        {
          api: data,
          createdAt: currentTime,
          updatedAt: currentTime,
          apiUpdatedAt: currentTime,
        },
        { upsert: true },
      );

      return;
    }

    const isRecordMonthOld =
      currentTime.valueOf() - ipRecord.apiUpdatedAt.valueOf() >
      30 * 24 * 60 * 60 * 1000;

    if (!isRecordMonthOld) {
      return;
    }

    const { data } = await axios.get(`${apiLink}/${ip}`);

    await IP.updateOne(
      { _id: ipRecord._id },
      {
        api: data,
        updatedAt: currentTime,
        apiUpdatedAt: currentTime,
      },
    );
  }
}

export const ipService = new IpService();
