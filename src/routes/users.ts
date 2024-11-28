import { Next } from 'koa';
import * as Router from 'koa-router';

import { isLoggedIn } from '../middleware/is-logged-in';
import { User } from '../models/user';
import { findById } from '../controllers/users';
import { encodeJwtToken } from '../helpers/jwt';
import { OAuth2Client } from 'google-auth-library';
import { API, GOOGLE_OAUTH } from '../config';
import { google } from 'googleapis';

export const router = new Router();

router.get(
  '/validate',
  isLoggedIn,
  (ctx: Router.IRouterContext, next: Next) => {
    ctx.body = {};
  },
);

router.get('/refresh', isLoggedIn, (ctx: Router.IRouterContext, next: Next) => {
  const { _id } = ctx.state.user;

  const jwtToken = encodeJwtToken({
    userId: _id,
  });

  ctx.body = {
    jwtToken,
  };
});

router.get('/', isLoggedIn, (ctx: Router.IRouterContext, next: Next) => {
  ctx.body = { user: ctx.state.user };
});

router.get('/:id', findById);

router.get('/auth/google', async (ctx, next) => {
  const { redirectUri, scopes } = ctx.query as Record<string, string>;

  if (!redirectUri) {
    throw new Error('no_redirect_uri');
  }

  ctx.session.redirectUri = decodeURIComponent(redirectUri as string);

  const client = new OAuth2Client({
    clientId: GOOGLE_OAUTH.CLIENT_ID,
    clientSecret: GOOGLE_OAUTH.CLIENT_SECRET,
    redirectUri: `${API.GOOGLE_CALLBACK_HOST}/users/auth/google/callback`,
  });

  const scope = ['https://www.googleapis.com/auth/userinfo.profile'];

  if (scopes?.split(',').includes('youtube')) {
    scope.push('https://www.googleapis.com/auth/youtube.readonly');
  }

  const res = await client.generateAuthUrl({
    access_type: 'offline',
    scope,
    prompt: 'consent',
  });

  ctx.set('location', res);
  ctx.set('cache-control', 'no-cache');
  ctx.status = 301;
});

router.get('/auth/google/callback', async (ctx, next) => {
  const { code } = ctx.query as Record<string, string>;

  const client = new OAuth2Client({
    clientId: GOOGLE_OAUTH.CLIENT_ID,
    clientSecret: GOOGLE_OAUTH.CLIENT_SECRET,
    redirectUri: `${API.GOOGLE_CALLBACK_HOST}/users/auth/google/callback`,
  });

  const { tokens } = await client.getToken(code);

  const tokenInfo = await client.getTokenInfo(tokens.access_token);

  const auth = new google.auth.OAuth2({
    clientId: GOOGLE_OAUTH.CLIENT_ID,
    clientSecret: GOOGLE_OAUTH.CLIENT_SECRET,
    redirectUri: `${API.GOOGLE_CALLBACK_HOST}/users/auth/google/callback`,
  });

  auth.setCredentials({
    access_token: tokens.access_token,
  });

  const {
    data: { name },
  } = await google.oauth2('v2').userinfo.get({
    auth,
  });

  const firstName = name || 'NO_DISPLAY_NAME';

  let user = await User.findOne({
    googleId: tokenInfo.sub,
  });

  if (user) {
    user.name = firstName;
    user.raw = {
      profile: tokenInfo,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
    };
    user.ipCreated = user.ipCreated || ctx.ip;
    user.ipUpdated = ctx.ip;

    await user.save();
  } else {
    user = await User.create({
      googleId: tokenInfo.sub,
      name: firstName,
      raw: {
        profile: tokenInfo,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      },
      ipCreated: ctx.ip,
      ipUpdated: ctx.ip,
    });
  }

  const { redirectUri } = ctx.session;

  const jwtToken = encodeJwtToken({
    userId: user._id,
  });

  ctx.redirect(`${redirectUri}${jwtToken}`);
});
