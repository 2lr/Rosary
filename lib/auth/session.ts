import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'rosary_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 180; // six months — this is a daily habit

export type SessionPayload = { uid: string; exp: number };

const DEV_FALLBACK_SECRET = 'rosary-development-secret-do-not-use-in-production';

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (value && value.length >= 16) return value;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'SESSION_SECRET is missing or shorter than 16 characters. Set it in the environment — see .env.example.',
    );
  }
  return DEV_FALLBACK_SECRET;
}

function sign(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('base64url');
}

export function serializeSession(userId: string): { value: string; maxAge: number } {
  const payload: SessionPayload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { value: `${body}.${sign(body)}`, maxAge: MAX_AGE_SECONDS };
}

export function parseSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const providedSignature = Buffer.from(token.slice(dot + 1));
  const expectedSignature = Buffer.from(sign(body));
  if (
    providedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(providedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as SessionPayload;
    if (typeof payload.uid !== 'string' || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string): Promise<void> {
  const { value, maxAge } = serializeSession(userId);
  (await cookies()).set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return parseSession(token)?.uid ?? null;
}
