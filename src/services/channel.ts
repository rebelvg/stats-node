import { ObjectId } from 'mongodb';

import { Channel, ChannelTypeEnum, IChannelModel } from '../models/channel';

class ChannelService {
  public async addChannel(channelName: string) {
    const channelRecord = await Channel.findOne({ name: channelName });

    if (!channelRecord) {
      await Channel.create({
        name: channelName,
        type: ChannelTypeEnum.PRIVATE,
        channelCreatedAt: new Date(),
      });

      return;
    }
  }

  public async setType(id: string, type: ChannelTypeEnum) {
    await Channel.updateOne({ _id: new ObjectId(id) }, { type });
  }

  public async getChannelsByType(
    type: ChannelTypeEnum,
  ): Promise<IChannelModel[]> {
    const channels = await Channel.find({ type });

    return channels;
  }

  public async getChannels(): Promise<IChannelModel[]> {
    const channels = await Channel.find(
      {},
      {
        sort: { type: -1, channelCreatedAt: -1 },
      },
    );

    return channels;
  }
}

export const channelService = new ChannelService();
