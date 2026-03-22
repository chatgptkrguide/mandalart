import { NextResponse } from 'next/server';
import { ensureUser, updateNickname } from '@/lib/user';

// POST /api/user - ensure user exists or update nickname
export async function POST(request: Request) {
  try {
    const { userId, nickname } = await request.json();
    if (!userId || !nickname) {
      return NextResponse.json({ error: 'userId and nickname required' }, { status: 400 });
    }
    await ensureUser(userId, nickname);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// PATCH /api/user - update nickname
export async function PATCH(request: Request) {
  try {
    const { userId, nickname } = await request.json();
    if (!userId || !nickname) {
      return NextResponse.json({ error: 'userId and nickname required' }, { status: 400 });
    }
    await updateNickname(userId, nickname);
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
