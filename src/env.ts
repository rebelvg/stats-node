import * as convict from 'convict';
import * as _ from 'lodash';
import { Buffer } from 'buffer';

convict.addFormat({
  name: 'stream-server-config',
  validate: (value) => {
    if (!_.isArray(value)) {
      throw new Error('must_be_an_array');
    }

    for (const item of value) {
      convict({
        NAME: {
          format: String,
          default: null,
        },
        HOSTS: {
          format: (value) => {
            if (!_.isArray(value)) {
              throw new Error('not_array');
            }

            if (!_.every(value, _.isString)) {
              throw new Error('not_valid_array');
            }

            if (value.length === 0) {
              throw new Error('no_hosts');
            }
          },
          default: null,
        },
        API_HOST: {
          format: String,
          default: null,
        },
        API_TOKEN: {
          format: String,
          default: null,
          sensitive: true,
        },
      })
        .load(item)
        .validate({ strict: true });
    }
  },
});

const config = convict({
  API: {
    PORT: {
      format: (value) => {
        if (!['string', 'number'].includes(typeof value)) {
          throw new Error('bad_value_type');
        }
      },
      default: null,
    },
    GOOGLE_CALLBACK_HOST: {
      format: String,
      default: null,
    },
  },
  DB_URI: {
    format: String,
    default: null,
  },
  GOOGLE_OAUTH: {
    CLIENT_ID: {
      format: String,
      default: null,
      sensitive: true,
    },
    CLIENT_SECRET: {
      format: String,
      default: null,
      sensitive: true,
    },
  },
  KLPQ_MEDIA_SERVER: {
    format: 'stream-server-config',
    default: null,
  },
  NODE_MEDIA_SERVER: {
    format: 'stream-server-config',
    default: null,
  },
  ADOBE_MEDIA_SERVER: {
    format: 'stream-server-config',
    default: null,
  },
  ENCODE_SERVICE: {
    format: 'stream-server-config',
    default: null,
  },
  JWT: {
    SECRET: {
      format: String,
      default: null,
      sensitive: true,
    },
  },
});

if (process.env.CONFIG_BASE64) {
  config.load(
    JSON.parse(
      Buffer.from(process.env.CONFIG_BASE64, 'base64').toString('utf-8'),
    ),
  );
} else {
  config.loadFile([process.cwd() + '/config.json']);
}

config.validate({ allowed: 'strict' });

export const env = config.get();
