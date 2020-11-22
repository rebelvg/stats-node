export const db = {
  host: 'localhost',
  dbName: 'nodestats',
  authDb: undefined,
  user: undefined,
  password: undefined,
};

export const ams = [
  {
    name: 'localhost:11001',
    host: 'http://localhost:11001',
    token: null,
  },
];

export const nms = [
  {
    name: 'localhost:11002',
    host: 'http://localhost:11002',
    token: null,
  },
];

export const stats = {
  port: 8000,
  googleCallbackHost: 'http://localhost:8000',
  googleRedirect: 'http://localhost:3000',
};
