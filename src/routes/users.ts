import { Next } from 'koa';
import Router, { RouterContext } from '@koa/router';

import { isLoggedIn } from '../middleware/is-logged-in';
import { User } from '../models/user';
import { findById } from '../controllers/users';
import { encodeJwtToken } from '../helpers/jwt';
import { OAuth2Client } from 'google-auth-library';
import { API, GOOGLE_OAUTH } from '../config';
import * as google from 'googleapis/build/src/apis/oauth2';
import { v4 } from 'uuid';

export const router = new Router();

router.get('/validate', isLoggedIn, (ctx: RouterContext, next: Next) => {
  ctx.body = {};
});

router.get('/refresh', isLoggedIn, (ctx: RouterContext, next: Next) => {
  const { _id } = ctx.state.user;

  const jwtToken = encodeJwtToken({
    userId: _id,
  });

  ctx.body = {
    jwtToken,
  };
});

router.get('/', isLoggedIn, (ctx: RouterContext, next: Next) => {
  ctx.body = { user: ctx.state.user };
});

router.get('/:id', findById);

router.get('/auth/google', async (ctx, next) => {
  const { redirectUri, scopes } = ctx.query as Record<string, string>;

  if (!redirectUri) {
    throw new Error('no_redirect_uri');
  }

  if (!ctx.session) {
    throw new Error();
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

  if (!tokens.access_token) {
    throw new Error();
  }

  const profile = await client.getTokenInfo(tokens.access_token);

  const auth = new google.auth.OAuth2({
    clientId: GOOGLE_OAUTH.CLIENT_ID,
    clientSecret: GOOGLE_OAUTH.CLIENT_SECRET,
    redirectUri: `${API.GOOGLE_CALLBACK_HOST}/users/auth/google/callback`,
  });

  auth.setCredentials({
    access_token: tokens.access_token,
  });

  const {
    data: { name, email },
  } = await google.oauth2('v2').userinfo.get({
    auth,
  });

  const userRecord = await User.findOne({
    googleId: profile.sub,
  });

  let userId: string | null = null;

  profile.email;

  if (!userRecord) {
    const newUserId = await User.create({
      googleId: profile.sub || null,
      ipCreated: ctx.ip,
      isAdmin: false,
      isStreamer: false,
      token: v4(),
      streamKey: v4(),

      email: email || null,
      name: name || null,
      ipUpdated: ctx.ip,
    });

    userId = newUserId.toString();
  } else {
    userId = userRecord._id.toString();

    await User.updateOne(
      { _id: userRecord._id },
      {
        email,
        name,
        ipUpdated: ctx.ip,
      },
    );
  }

  if (!ctx.session) {
    throw new Error();
  }

  const { redirectUri } = ctx.session;

  const jwtToken = encodeJwtToken({
    userId,
  });

  ctx.redirect(`${redirectUri}${jwtToken}`);
});
