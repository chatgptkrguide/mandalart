import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { queryD1, executeD1 } from '@/lib/d1';

interface MandalartRow {
  id: string;
  user_id: string;
  title: string;
  center_goal: string;
  start_date: string;
  end_date: string;
  is_public: number;
  created_at: string;
  updated_at: string;
  nickname?: string;
  avatar_url?: string;
}

interface CellRow {
  id: string;
  mandalart_id: string;
  position: number;
  content: string;
  cell_type: string;
  parent_position: number | null;
}

interface CompletionRow {
  id: string;
  cell_id: string;
  completed_at: string;
  week_number: number;
  note: string | null;
}

// GET /api/mandalarts/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();

  const mandalarts = await queryD1<MandalartRow>(
    `SELECT m.*, u.nickname, u.avatar_url
    FROM mandalarts m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = ?1`,
    [id]
  );

  if (mandalarts.length === 0) {
    return NextResponse.json({ error: '만다라트를 찾을 수 없습니다' }, { status: 404 });
  }

  const mandalart = mandalarts[0];

  // Check access
  if (!mandalart.is_public && (!user || user.id !== mandalart.user_id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
  }

  // Get cells
  const cells = await queryD1<CellRow>(
    'SELECT * FROM mandalart_cells WHERE mandalart_id = ?1 ORDER BY position',
    [id]
  );

  // Get completions
  const completions = await queryD1<CompletionRow>(
    'SELECT * FROM task_completions WHERE mandalart_id = ?1 ORDER BY completed_at DESC',
    [id]
  );

  return NextResponse.json({
    mandalart: {
      ...mandalart,
      is_public: !!mandalart.is_public,
      isOwner: user?.id === mandalart.user_id,
    },
    cells,
    completions,
  });
}

// DELETE /api/mandalarts/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id FROM mandalarts WHERE id = ?1',
    [id]
  );

  if (mandalarts.length === 0 || mandalarts[0].user_id !== user.id) {
    return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 });
  }

  await executeD1('DELETE FROM mandalarts WHERE id = ?1', [id]);

  return NextResponse.json({ ok: true });
}
