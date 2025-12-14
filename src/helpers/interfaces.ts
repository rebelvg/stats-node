export interface IChannel {
  channel: string;
  publisher: {
    _id: string;
    server: string;
    app: string;
    channel: string;
    connectId: string;
    connectCreated: Date;
    connectUpdated: Date;
    bytes: number;
    protocol: string;
    lastBitrate: number;
    userId: string | null;
    totalConnectionsCount: number;
    peakViewersCount: number;
    duration: number;
    bitrate: number;
    createdAt: Date;
    updatedAt: Date;
    isLive: boolean;
    userName: string | null;
  } | null;
  subscribers: {
    _id: string;
    server: string;
    app: string;
    channel: string;
    connectId: string;
    connectCreated: Date;
    connectUpdated: Date;
    bytes: number;
    protocol: string;
    userId: string | null;
    streamIds: string[];
    duration: number;
    bitrate: number;
    createdAt: Date;
    updatedAt: Date;
    isLive: boolean;
  };
}

export interface IChannelServerStats {
  server: string;
  apps: {
    app: string;
    channels: IChannel[];
  }[];
}
