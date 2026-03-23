import { NextResponse } from 'next/server';
import { ensureUser } from '@/lib/user';
import { createSession, getSessionUser, sessionCookieOptions } from '@/lib/session';
import { queryD1 } from '@/lib/d1';

// POST /api/user - login by nickname (find or create)
export async function POST(request: Request) {
  try {
    // Already logged in? Return current user
    const existing = await getSessionUser();
    if (existing) {
      await ensureUser(existing.userId, existing.nickname);
      return NextResponse.json({ user: existing });
    }

    const body = await request.json().catch(() => ({}));
    const nickname = (body.nickname || '').trim();

    // Empty nickname = just checking session (no session found above)
    if (!nickname) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    if (nickname.length > 20) {
      return NextResponse.json({ error: '이름은 20자 이내로 입력하세요' }, { status: 400 });
    }

    // Find existing user by nickname
    const users = await queryD1<{ id: string; nickname: string }>(
      'SELECT id, nickname FROM users WHERE nickname = ?1 LIMIT 1',
      [nickname]
    );

    let userId: string;
    let nick: string;

    if (users.length > 0) {
      // Existing user
      userId = users[0].id;
      nick = users[0].nickname;
    } else {
      // New user
      userId = 'u_' + crypto.randomUUID();
      nick = nickname;
      await ensureUser(userId, nick);
    }

    const token = await createSession(userId, nick);
    const response = NextResponse.json({ user: { userId, nickname: nick } });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ error: '로그인 실패' }, { status: 500 });
  }
}

// PATCH /api/user - update nickname
export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: '세션이 없습니다' }, { status: 401 });
    }

    const { nickname } = await request.json();
    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0 || nickname.length > 20) {
      return NextResponse.json({ error: '이름이 올바르지 않습니다' }, { status: 400 });
    }

    const { updateNickname } = await import('@/lib/user');
    await updateNickname(session.userId, nickname.trim());

    const token = await createSession(session.userId, nickname.trim());
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.json({ error: '변경 실패' }, { status: 500 });
  }
}

// DELETE /api/user - logout (clear session)
export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: 'mandalart_sid',
    value: '',
    maxAge: 0,
    path: '/',
  });
  return response;
}
