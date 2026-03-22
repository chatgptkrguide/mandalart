import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { queryD1, executeD1 } from './d1';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const COOKIE_NAME = 'mandalart_token';

interface UserRow {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  password_hash?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  nickname: string;
  avatar_url: string | null;
}

function generateId(): string {
  return crypto.randomUUID();
}

export async function signUp(email: string, password: string, nickname: string) {
  const existing = await queryD1<UserRow>('SELECT id FROM users WHERE email = ?1', [email]);
  if (existing.length > 0) {
    throw new Error('이미 사용 중인 이메일입니다');
  }

  const id = generateId();
  const passwordHash = await bcrypt.hash(password, 10);

  await executeD1(
    'INSERT INTO users (id, email, password_hash, nickname) VALUES (?1, ?2, ?3, ?4)',
    [id, email, passwordHash, nickname || email.split('@')[0]]
  );

  const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: '30d' });
  return { token, user: { id, email, nickname: nickname || email.split('@')[0], avatar_url: null } };
}

export async function signIn(email: string, password: string) {
  const users = await queryD1<UserRow>(
    'SELECT id, email, nickname, avatar_url, password_hash FROM users WHERE email = ?1',
    [email]
  );

  if (users.length === 0) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const user = users[0];
  const valid = await bcrypt.compare(password, user.password_hash!);
  if (!valid) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다');
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
  return {
    token,
    user: { id: user.id, email: user.email, nickname: user.nickname, avatar_url: user.avatar_url },
  };
}

export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const users = await queryD1<UserRow>(
      'SELECT id, email, nickname, avatar_url FROM users WHERE id = ?1',
      [decoded.userId]
    );

    if (users.length === 0) return null;
    return users[0];
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 30 * 24 * 60 * 60,
    path: '/',
  };
}

export function clearAuthCookie() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  };
}
