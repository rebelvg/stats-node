import * as _ from 'lodash';
import * as fs from 'fs';
import { Buffer } from 'buffer';
import * as path from 'path';

import { z } from 'zod';

const ServiceArraySchema = z.array(
  z.object({
    API_ORIGIN: z.url(),
    API_SECRET: z.string(),
  }),
);

export const ConfigSchema = z.object({
  API: z.object({
    PORT: z.string().or(z.number()).describe('port || unix socket'),
    GOOGLE_CALLBACK_HOST: z.url(),
  }),

  DB_URI: z.string(),

  GOOGLE_OAUTH: z.object({
    CLIENT_ID: z.string().nullable(),
    CLIENT_SECRET: z.string().nullable(),
  }),

  KOLPAQUE_RTMP: ServiceArraySchema,
  KOLPAQUE_ENCODE: ServiceArraySchema,
  NODE_MEDIA_SERVER: ServiceArraySchema,
  ADOBE_MEDIA_SERVER: ServiceArraySchema,

  JWT: z.object({
    SECRET: z.string().nullable(),
  }),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

let envJson: string;

if (process.env.CONFIG_BASE64) {
  envJson = Buffer.from(process.env.CONFIG_BASE64, 'base64').toString('utf-8');
} else {
  envJson = fs.readFileSync(path.resolve(process.cwd(), './config.json'), {
    encoding: 'utf-8',
  });
}

export const env = ConfigSchema.parse(JSON.parse(envJson));
