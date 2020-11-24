export const DB = {
  host: 'localhost',
  dbName: 'nodestats',
  authDb: undefined,
  user: undefined,
  password: undefined,
};

export const AMS = [
  {
    name: 'ams1',
    hosts: ['localhost:11001'],
    host: 'http://localhost:11001',
    token: null,
  },
];

export const NMS = [
  {
    name: 'nms1',
    hosts: ['localhost:11002'],
    host: 'http://localhost:11002',
    token: null,
  },
];

export const API = {
  port: 8000,
  googleCallbackHost: 'http://localhost:8000',
  googleRedirect: 'http://localhost:3000',
};
