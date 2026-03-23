import { NextResponse } from 'next/server';
import { ensureUser, updateNickname } from '@/lib/user';
import { createSession, getSessionUser, sessionCookieOptions } from '@/lib/session';

// POST /api/user - init or get session
export async function POST(request: Request) {
  try {
    // Check if already has session
    const existing = await getSessionUser();
    if (existing) {
      // Ensure user still exists in DB
      await ensureUser(existing.userId, existing.nickname);
      return NextResponse.json({ user: existing });
    }

    // New user - create session
    const { nickname } = await request.json().catch(() => ({ nickname: '' }));
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

    // Update session with new nickname
    const token = await createSession(session.userId, nickname);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err: unknown) {
    return NextResponse.json({ error: '닉네임 변경 실패' }, { status: 500 });
  }
}
