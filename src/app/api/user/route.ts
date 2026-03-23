import { NextResponse } from 'next/server';
import { ensureUser, updateNickname } from '@/lib/user';
import { createSession, getSessionUser, sessionCookieOptions } from '@/lib/session';
import { queryD1, executeD1 } from '@/lib/d1';

// POST /api/user - init or get session
export async function POST(request: Request) {
  try {
    // Check if already has session
    const existing = await getSessionUser();
    if (existing) {
      await ensureUser(existing.userId, existing.nickname);
      return NextResponse.json({ user: existing });
    }

    // Parse body
    const body = await request.json().catch(() => ({}));
    const nickname = body.nickname || '익명';
    const legacyUserId = body.legacyUserId || null;

    // If legacy user exists in DB, adopt that identity
    if (legacyUserId) {
      const legacyUsers = await queryD1<{ id: string; nickname: string }>(
        'SELECT id, nickname FROM users WHERE id = ?1',
        [legacyUserId]
      );
      if (legacyUsers.length > 0) {
        const lu = legacyUsers[0];
        const token = await createSession(lu.id, lu.nickname);
        const response = NextResponse.json({ user: { userId: lu.id, nickname: lu.nickname } });
        response.cookies.set(sessionCookieOptions(token));
        return response;
      }
    }

    // New user
    const userId = 'u_' + crypto.randomUUID();
    const nick = nickname || '익명';

    await ensureUser(userId, nick);
    const token = await createSession(userId, nick);

    const response = NextResponse.json({ user: { userId, nickname: nick } });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err: unknown) {
    return NextResponse.json({ error: '사용자 초기화 실패' }, { status: 500 });
  }
}

// PATCH /api/user - update nickname (session-protected)
export async function PATCH(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: '세션이 없습니다' }, { status: 401 });
    }

    const { nickname } = await request.json();
    if (!nickname || typeof nickname !== 'string' || nickname.length > 20) {
      return NextResponse.json({ error: '닉네임이 올바르지 않습니다' }, { status: 400 });
    }

    await updateNickname(session.userId, nickname);

    const token = await createSession(session.userId, nickname);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err: unknown) {
    return NextResponse.json({ error: '닉네임 변경 실패' }, { status: 500 });
  }
}
