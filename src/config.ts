import { env, ServiceTypeEnum } from './env';

export const API = {
  PORT: env.API.PORT,
  GOOGLE_CALLBACK_HOST: env.API.GOOGLE_CALLBACK_HOST,
};

export const DB_URI: string = env.DB_URI;

export const GOOGLE_OAUTH = {
  CLIENT_ID: env.GOOGLE_OAUTH.CLIENT_ID,
  CLIENT_SECRET: env.GOOGLE_OAUTH.CLIENT_SECRET,
};

export const KOLPAQUE_RTMP = env.SERVICES.filter(
  (s) => s.TYPE === ServiceTypeEnum.KOLPAQUE_RTMP,
);

export const KOLPAQUE_ENCODE = env.SERVICES.filter(
  (s) => s.TYPE === ServiceTypeEnum.KOLPAQUE_ENCODE,
);

export const NODE_MEDIA_SERVER = env.SERVICES.filter(
  (s) => s.TYPE === ServiceTypeEnum.NODE_MEDIA_SERVER,
);

export const ADOBE_MEDIA_SERVER = env.SERVICES.filter(
  (s) => s.TYPE === ServiceTypeEnum.ADOBE_MEDIA_SERVER,
);

export const JWT = {
  SECRET: env.JWT.SECRET,
};
