export const DB = {
  HOST: 'localhost',
  NAME: 'nodestats',
  AUTH_SOURCE: undefined,
  USER: undefined,
  PASSWORD: undefined,
};

export const GOOGLE_KEYS = {
  CLIENT_ID: null,
  CLIENT_SECRET: null,
};

export const AMS = [
  {
    NAME: 'ams1',
    HOSTS: ['ams-host:80'],
    API_HOST: 'http://ams-host:80',
    API_TOKEN: null,
  },
];

export const NMS = [
  {
    NAME: 'nms1',
    HOSTS: ['nms-host:80'],
    API_HOST: 'http://nms-host:80',
    API_TOKEN: null,
  },
];

export const API = {
  PORT: 8000,
  GOOGLE_CALLBACK_HOST: 'http://localhost:8000',
  GOOGLE_REDIRECT_URL: 'http://localhost:3000/login',
};
