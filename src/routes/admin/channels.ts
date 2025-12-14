import Router from '@koa/router';
import { channelService } from '../../services/channel';
import { ChannelTypeEnum } from '../../models/channel';
import { BadRequest } from '../../helpers/errors';

export const router = new Router();

router.get('/', async (ctx, next) => {
  const channels = await channelService.getChannels();

  ctx.body = {
    channels,
  };
});
router.put('/:id', async (ctx) => {
  const { id } = ctx.params;
  const { type } = ctx.request.body as { type: ChannelTypeEnum };

  if (!Object.values(ChannelTypeEnum).includes(type)) {
    throw new BadRequest('bad_type');
  }

  await channelService.setType(id, type);

  ctx.status = 201;
});
