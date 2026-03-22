import { NextResponse } from 'next/server';
import { signIn, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력하세요' }, { status: 400 });
    }

    const { token, user } = await signIn(email, password);

    const response = NextResponse.json({ user });
    response.cookies.set(setAuthCookie(token));
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
