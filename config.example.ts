export const DB = {
  host: 'localhost',
  dbName: 'nodestats',
  authDb: undefined,
  user: undefined,
  password: undefined,
};

export const GOOGLE_KEYS = {
  client_id: null,
  client_secret: null,
};

export const AMS = [
  {
    name: 'ams1',
    hosts: ['localhost:11001'],
    apiHost: 'http://localhost:11001',
    apiToken: null,
  },
];

export const NMS = [
  {
    name: 'nms1',
    hosts: ['localhost:11002'],
    apiHost: 'http://localhost:11002',
    apiToken: null,
  },
];

export const API = {
  port: 8000,
  googleCallbackHost: 'http://localhost:8000',
  googleRedirect: 'http://localhost:3000',
};
