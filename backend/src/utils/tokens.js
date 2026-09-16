import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), tokenVersion: user.tokenVersion || 0 },
    env.jwtRefreshSecret,
    { expiresIn: env.jwtRefreshExpiresIn }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}

const isProd = env.nodeEnv === 'production';

// In production the frontend (Vercel) and backend (Render) live on different
// domains, so this is a cross-site request from the browser's point of view.
// Cross-site cookies require `sameSite: 'none'` + `secure: true` (`strict`,
// and even `lax`, are silently dropped by browsers on cross-origin
// XHR/fetch), which is why login previously appeared to "work" (200 response)
// but the browser never actually stored/sent the auth cookies afterwards.
// Locally, frontend and backend differ only by port, which browsers still
// treat as cross-site for sameSite purposes, so we use 'lax' there since
// secure cookies require HTTPS, which local dev doesn't have.
export const accessCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 15 * 60 * 1000,
  path: '/',
};

export const refreshCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth/refresh',
};
