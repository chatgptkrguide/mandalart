import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { queryD1, executeD1 } from '@/lib/d1';
import { generateId, getCurrentWeekNumber } from '@/lib/utils';

interface MandalartRow { user_id: string; start_date: string; }
interface CellRow { content: string; }
interface CompletionRow { id: string; }

// POST /api/mandalarts/[id]/complete (session-protected, owner only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mandalartId } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: '세션이 필요합니다' }, { status: 401 });
  }

  const { cellId, action } = await request.json();
  if (!cellId) {
    return NextResponse.json({ error: 'cellId가 필요합니다' }, { status: 400 });
  }

  // Verify ownership
  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id, start_date FROM mandalarts WHERE id = ?1', [mandalartId]
  );
  if (mandalarts.length === 0) {
    return NextResponse.json({ error: '만다라트를 찾을 수 없습니다' }, { status: 404 });
  }
  if (mandalarts[0].user_id !== session.userId) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  const weekNumber = getCurrentWeekNumber(mandalarts[0].start_date);

  if (action === 'complete') {
    const existing = await queryD1<CompletionRow>(
      'SELECT id FROM task_completions WHERE cell_id = ?1 AND week_number = ?2', [cellId, weekNumber]
    );
    if (existing.length > 0) {
      return NextResponse.json({ error: '이미 완료됨' }, { status: 400 });
    }

    await executeD1(
      'INSERT INTO task_completions (id, cell_id, mandalart_id, user_id, week_number) VALUES (?1, ?2, ?3, ?4, ?5)',
      [generateId(), cellId, mandalartId, session.userId, weekNumber]
    );

    const cells = await queryD1<CellRow>('SELECT content FROM mandalart_cells WHERE id = ?1', [cellId]);
    await executeD1(
      'INSERT INTO activity_logs (id, mandalart_id, user_id, cell_id, action, cell_content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      [generateId(), mandalartId, session.userId, cellId, 'completed', cells[0]?.content || '']
    );

    return NextResponse.json({ completed: true, weekNumber });
  } else {
    await executeD1(
      'DELETE FROM task_completions WHERE cell_id = ?1 AND week_number = ?2 AND user_id = ?3',
      [cellId, weekNumber, session.userId]
    );

    const cells = await queryD1<CellRow>('SELECT content FROM mandalart_cells WHERE id = ?1', [cellId]);
    await executeD1(
      'INSERT INTO activity_logs (id, mandalart_id, user_id, cell_id, action, cell_content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      [generateId(), mandalartId, session.userId, cellId, 'uncompleted', cells[0]?.content || '']
    );

    return NextResponse.json({ completed: false, weekNumber });
  }
}
