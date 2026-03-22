import { NextResponse } from 'next/server';
import { signUp, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password, nickname } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다' }, { status: 400 });
    }

    const { token, user } = await signUp(email, password, nickname);

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(setAuthCookie(token));
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '가입 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
