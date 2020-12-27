import * as convict from 'convict';

convict.addFormat({
  name: 'stream-server-config',
  validate: function (sources) {
    if (!Array.isArray(sources)) {
      throw new Error('must_be_an_array');
    }

    for (const source of sources) {
      convict({
        NAME: {
          format: String,
          default: null,
        },
        HOSTS: {
          format: Array,
          default: null,
        },
        API_HOST: {
          format: String,
          default: null,
        },
        API_TOKEN: {
          format: String,
          default: null,
        },
      })
        .load(source)
        .validate();
    }
  },
});

const config = convict({
  API: {
    PORT: {
      format: 'port',
      default: null,
    },
    GOOGLE_CALLBACK_HOST: {
      format: String,
      default: null,
    },
    GOOGLE_REDIRECT_URL: {
      format: String,
      default: null,
    },
  },
  DB: {
    HOST: {
      format: String,
      default: null,
    },
    NAME: {
      format: String,
      default: null,
    },
    AUTH_SOURCE: {
      format: '*',
      default: null,
    },
    USER: {
      format: '*',
      default: null,
    },
    PASSWORD: {
      format: '*',
      default: null,
    },
  },
  GOOGLE_OAUTH: {
    CLIENT_ID: {
      format: String,
      default: null,
    },
    CLIENT_SECRET: {
      format: String,
      default: null,
    },
  },
  AMS: {
    format: 'stream-server-config',
    default: null,
  },
  NMS: {
    format: 'stream-server-config',
    default: null,
  },
});

config.loadFile([process.cwd() + '/config.json']);

config.validate({ allowed: 'strict' });

export const env = config.get();
