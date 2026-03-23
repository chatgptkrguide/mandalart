import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'mandalart-fallback-secret-2026');
const COOKIE_NAME = 'mandalart_sid';

export interface SessionUser {
  userId: string;
  nickname: string;
}

// Create a signed session token
export async function createSession(userId: string, nickname: string): Promise<string> {
  return new SignJWT({ userId, nickname })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('365d')
    .sign(SECRET);
}

// Get current user from session cookie (server-side)
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET);
    if (!payload.userId || typeof payload.userId !== 'string') return null;

    return {
      userId: payload.userId as string,
      nickname: (payload.nickname as string) || '익명',
    };
  } catch {
    return null;
  }
}

// Cookie options for setting session
export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 365 * 24 * 60 * 60,
    path: '/',
  };
}
