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
      appsPath: '/usr/ams/applications',
      host: 'http://localhost:1111',
      user: null,
      password: null
    }
  ],
  nms: [
    {
      name: 'nms1',
      host: 'http://localhost:8000',
      token: null
    }
  ],
  stats: {
    port: 8001,
    googleCallbackHost: 'http://localhost:8001',
    googleRedirect: 'http://localhost:3000'
  }
};
