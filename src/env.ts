import _ from 'lodash';
import * as fs from 'fs';
import { Buffer } from 'buffer';
import * as path from 'path';

import { z } from 'zod';
import { EnumProtocols } from './helpers/interfaces';

export enum ServiceTypeEnum {
  KOLPAQUE_RTMP = 'KOLPAQUE_RTMP',
  KOLPAQUE_ENCODE = 'KOLPAQUE_ENCODE',
  NODE_MEDIA_SERVER = 'NODE_MEDIA_SERVER',
  ADOBE_MEDIA_SERVER = 'ADOBE_MEDIA_SERVER',
}

const ProtocolKey = z.enum(EnumProtocols);

const ProtocolConfig = z
  .object({
    apps: z.array(z.string()).nonempty(),
    origin: z.string(),
  })
  .optional();

const ProtocolsSchema = z.record(ProtocolKey, ProtocolConfig);

const BaseApiServiceSchema = z.object({
  TYPE: z.enum(ServiceTypeEnum),
  API_ORIGIN: z.string(),
  API_SECRET: z.string(),
  PROTOCOLS: ProtocolsSchema,
});

export type IWorkerApiBase = z.infer<typeof BaseApiServiceSchema>;

const BasePushServiceSchema = z.object({
  TYPE: z.enum(ServiceTypeEnum),
  PUSH_SECRET: z.string(),
  PROTOCOLS: ProtocolsSchema,
});

const RtmpServiceSchema = BaseApiServiceSchema.extend({
  TYPE: z.enum([ServiceTypeEnum.KOLPAQUE_RTMP]),
}).strict();

const NodeMediaServerSchema = BaseApiServiceSchema.extend({
  TYPE: z.enum([ServiceTypeEnum.NODE_MEDIA_SERVER]),
}).strict();

const AdobeMediaServerSchema = BaseApiServiceSchema.extend({
  TYPE: z.enum([ServiceTypeEnum.ADOBE_MEDIA_SERVER]),
}).strict();

const EncodeServiceSchema = BasePushServiceSchema.extend({
  TYPE: z.enum([ServiceTypeEnum.KOLPAQUE_ENCODE]),
  PUSH_SECRET: z.string(),
}).strict();

const ServiceSchema = z.discriminatedUnion('TYPE', [
  RtmpServiceSchema,
  EncodeServiceSchema,
  NodeMediaServerSchema,
  AdobeMediaServerSchema,
]);

export type IWorkerConfig = z.infer<typeof ServiceSchema>;

export const ConfigSchema = z.object({
  API: z.object({
    PORT: z.string().or(z.number()).describe('port || unix socket'),
    GOOGLE_CALLBACK_HOST: z.url(),
  }),

  DB_URI: z.string(),

  GOOGLE_OAUTH: z.object({
    CLIENT_ID: z.string(),
    CLIENT_SECRET: z.string(),
  }),

  SERVICES: z.array(ServiceSchema),

  JWT: z.object({
    SECRET: z.string(),
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
