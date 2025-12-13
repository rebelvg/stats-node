import Router from 'koa-router';
import { updateChannel } from '../../controllers/channels';
import { channelService } from '../../services/channel';

export const router = new Router();

router.get('/', async (ctx, next) => {
  const channels = await channelService.getChannels();

  ctx.body = {
    channels,
  };
});
router.put('/:id', updateChannel);
