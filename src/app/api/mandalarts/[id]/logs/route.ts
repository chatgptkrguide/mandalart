import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { queryD1 } from '@/lib/d1';

interface LogRow {
  id: string;
  mandalart_id: string;
  action: string;
  cell_content: string;
  created_at: string;
}

interface MandalartRow {
  user_id: string;
  is_public: number;
}

// GET /api/mandalarts/[id]/logs
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mandalartId } = await params;
  const user = await getAuthUser();

  // Check access
  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id, is_public FROM mandalarts WHERE id = ?1',
    [mandalartId]
  );

  if (mandalarts.length === 0) {
    return NextResponse.json({ error: '만다라트를 찾을 수 없습니다' }, { status: 404 });
  }

  if (!mandalarts[0].is_public && (!user || user.id !== mandalarts[0].user_id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
  }

  const logs = await queryD1<LogRow>(
    `SELECT * FROM activity_logs
    WHERE mandalart_id = ?1
    ORDER BY created_at DESC
    LIMIT 200`,
    [mandalartId]
  );

  return NextResponse.json({ logs });
}
