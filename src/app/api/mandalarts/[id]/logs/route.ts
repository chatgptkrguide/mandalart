import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { queryD1 } from '@/lib/d1';

interface LogRow {
  id: string; action: string; cell_content: string; created_at: string;
}
interface MandalartRow {
  user_id: string; is_public: number;
}

// GET /api/mandalarts/[id]/logs (access-controlled)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();

  // Check access
  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id, is_public FROM mandalarts WHERE id = ?1', [id]
  );
  if (mandalarts.length === 0) {
    return NextResponse.json({ error: '만다라트를 찾을 수 없습니다' }, { status: 404 });
  }

  // Private: owner only. Public: anyone can see logs.
  if (!mandalarts[0].is_public && (!session || session.userId !== mandalarts[0].user_id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
  }

  const logs = await queryD1<LogRow>(
    'SELECT * FROM activity_logs WHERE mandalart_id = ?1 ORDER BY created_at DESC LIMIT 200',
    [id]
  );

  return NextResponse.json({ logs });
}
