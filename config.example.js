module.exports = {
  db: {
    host: 'localhost',
    dbName: 'nodestats',
    authDb: null,
    user: null,
    password: null
  },
  ams: [
    {
      name: 'ams1',
      host: 'http://localhost:11000',
      token: null
    }
  ],
  nms: [
    {
      name: 'nms1',
      host: 'http://localhost:11000',
      token: null
    }
  ],
  stats: {
    port: 8000,
    googleCallbackHost: 'http://localhost:8000',
    googleRedirect: 'http://localhost:3000'
  }
};
