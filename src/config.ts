import { env } from './env';

export interface IWorkerConfig {
  NAME: string;
  HOSTS: string[];
  API_HOST: string;
  API_TOKEN: string;
}

export const API = {
  PORT: env.API.PORT,
  GOOGLE_CALLBACK_HOST: env.API.GOOGLE_CALLBACK_HOST,
};

export const DB = {
  HOST: env.DB.HOST,
  NAME: env.DB.NAME,
  AUTH_SOURCE: env.DB.AUTH_SOURCE,
  USER: env.DB.USER,
  PASSWORD: env.DB.PASSWORD,
};

export const GOOGLE_OAUTH = {
  CLIENT_ID: env.GOOGLE_OAUTH.CLIENT_ID,
  CLIENT_SECRET: env.GOOGLE_OAUTH.CLIENT_SECRET,
};

export const KLPQ_MEDIA_SERVER: IWorkerConfig[] = env.KLPQ_MEDIA_SERVER;

export const NODE_MEDIA_SERVER: IWorkerConfig[] = env.NODE_MEDIA_SERVER;

export const ADOBE_MEDIA_SERVER: IWorkerConfig[] = env.ADOBE_MEDIA_SERVER;

export const JWT = {
  SECRET: env.JWT.SECRET,
};
