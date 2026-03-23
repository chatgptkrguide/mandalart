import { NextResponse } from 'next/server';
import { getSessionUser, createSession, sessionCookieOptions } from '@/lib/session';
import { getOrCreateAccessCode, findUserByAccessCode } from '@/lib/access-code';
import { ensureUser } from '@/lib/user';

// GET /api/user/code - get my access code
export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: '세션이 필요합니다' }, { status: 401 });
  }

  const code = await getOrCreateAccessCode(session.userId);
  return NextResponse.json({ code });
}

// POST /api/user/code - login with access code (link device)
export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: '접속 코드를 입력하세요' }, { status: 400 });
    }

    const user = await findUserByAccessCode(code.trim());
    if (!user) {
      return NextResponse.json({ error: '존재하지 않는 코드입니다' }, { status: 404 });
    }

    // Create session for this user on this device
    await ensureUser(user.id, user.nickname);
    const token = await createSession(user.id, user.nickname);

    const response = NextResponse.json({ user: { userId: user.id, nickname: user.nickname } });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (err: unknown) {
    return NextResponse.json({ error: '코드 인증 실패' }, { status: 500 });
  }
}
