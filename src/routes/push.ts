import * as Router from 'koa-router';
import { z } from 'zod';
import * as _ from 'lodash';

import { KolpaqueEncodeServiceWorker } from '../workers/kolpaque-encode';
import { KOLPAQUE_ENCODE } from '../config';

export const router = new Router();

export const KolpaqueEncodePushSchema = z.object({
  stats: z.array(
    z.object({
      app: z.string(),
      channels: z.array(
        z.object({
          channel: z.string(),
          publisher: z.object({
            connectId: z.string(),
            connectCreated: z.coerce.date(),
            connectUpdated: z.coerce.date(),
            bytes: z.number(),
            protocol: z.string(),
          }),
          subscribers: z.array(
            z.object({
              connectId: z.string(),
              connectCreated: z.coerce.date(),
              connectUpdated: z.coerce.date(),
              bytes: z.number(),
              ip: z.string(),
              protocol: z.string(),
            }),
          ),
        }),
      ),
    }),
  ),
});

export type IKolpaqueEncodePush = z.infer<typeof KolpaqueEncodePushSchema>;

router.post('/kolpaque-encode', async (ctx, next) => {
  const { body } = ctx.request;
  const { authorization } = ctx.headers;

  const service = _.find(KOLPAQUE_ENCODE, { API_SECRET: authorization });

  if (!service) {
    throw new Error('bad_token');
  }

  const { stats } = KolpaqueEncodePushSchema.parse(body);

  const worker = new KolpaqueEncodeServiceWorker();

  const mappedStats = worker.map(stats, ctx.request.ip);

  const { host } = new URL(service.API_ORIGIN);

  await worker.processStats(mappedStats, host);
});
