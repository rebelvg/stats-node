import * as jsonwebtoken from 'jsonwebtoken';

import { JWT } from '../config';

interface IJwtPayload {
  userId: string;
}

export function encodeJwtToken(data: IJwtPayload) {
  return jsonwebtoken.sign(data, JWT.SECRET, { noTimestamp: true });
}

export function decodeJwtToken(jwtToken: string) {
  return jsonwebtoken.verify(jwtToken, JWT.SECRET, {
    ignoreExpiration: true,
  }) as IJwtPayload;
}
