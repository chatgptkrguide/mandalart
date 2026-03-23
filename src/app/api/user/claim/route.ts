import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { queryD1, executeD1 } from '@/lib/d1';

// POST /api/user/claim - transfer mandalarts from old userId to current session
export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: '세션이 필요합니다' }, { status: 401 });
    }

    const { oldUserId } = await request.json();
    if (!oldUserId || typeof oldUserId !== 'string') {
      return NextResponse.json({ error: 'oldUserId가 필요합니다' }, { status: 400 });
    }

    // Don't allow claiming own data
    if (oldUserId === session.userId) {
      return NextResponse.json({ error: '같은 사용자입니다' }, { status: 400 });
    }

    // Check if old user has mandalarts
    const mandalarts = await queryD1<{ id: string }>(
      'SELECT id FROM mandalarts WHERE user_id = ?1',
      [oldUserId]
    );

    if (mandalarts.length === 0) {
      return NextResponse.json({ error: '이전할 만다라트가 없습니다' }, { status: 404 });
    }

    // Transfer ownership
    await executeD1('UPDATE mandalarts SET user_id = ?1 WHERE user_id = ?2', [session.userId, oldUserId]);
    await executeD1('UPDATE task_completions SET user_id = ?1 WHERE user_id = ?2', [session.userId, oldUserId]);
    await executeD1('UPDATE activity_logs SET user_id = ?1 WHERE user_id = ?2', [session.userId, oldUserId]);

    return NextResponse.json({ ok: true, transferred: mandalarts.length });
  } catch (err: unknown) {
    return NextResponse.json({ error: '이전 실패' }, { status: 500 });
  }
}
