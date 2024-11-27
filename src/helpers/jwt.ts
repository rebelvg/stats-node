import * as jsonwebtoken from 'jsonwebtoken';

import { JWT } from '../config';

interface IJwtPayload {
  _v1: 'v1';
  userId: string;
}

export function encodeJwtToken(data: Partial<IJwtPayload>) {
  return jsonwebtoken.sign(
    {
      _v: 'v1',
      ...data,
    },
    JWT.SECRET,
    { expiresIn: '60d' },
  );
}

export function decodeJwtToken(jwtToken: string) {
  const data = jsonwebtoken.verify(jwtToken, JWT.SECRET, {}) as IJwtPayload;

  if (data._v1 !== 'v1') {
    throw new Error('old_token');
  }

  return data;
}
