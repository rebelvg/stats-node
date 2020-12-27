import { env } from './env';
import { IWorkerConfig } from './workers';

export const API = {
  PORT: env.API.PORT,
  GOOGLE_CALLBACK_HOST: env.API.GOOGLE_CALLBACK_HOST,
  GOOGLE_REDIRECT_URL: env.API.GOOGLE_REDIRECT_URL,
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

export const AMS: IWorkerConfig[] = env.AMS;

export const NMS: IWorkerConfig[] = env.NMS;
