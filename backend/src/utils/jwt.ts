import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload } from '../types';
import crypto from 'crypto';

export const generateAccessToken = (payload: TokenPayload): string => {
  const nonce = crypto.randomUUID();
  return jwt.sign({ ...payload, jti: nonce }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as any,
  });
};

export const generateRefreshToken = (payload: TokenPayload): { token: string; hash: string; expiresAt: Date } => {
  const nonce = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti: nonce }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as any,
  });

  const hash = crypto.createHash('sha256').update(token).digest('hex');
  
  // Calculate expiration (7 days default)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return { token, hash, expiresAt };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;
};

export const hashTokenString = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
