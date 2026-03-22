import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { queryD1, executeD1 } from '@/lib/d1';
import { generateId, getCurrentWeekNumber } from '@/lib/utils';

interface MandalartRow {
  user_id: string;
  start_date: string;
}

interface CellRow {
  id: string;
  content: string;
}

interface CompletionRow {
  id: string;
}

// POST /api/mandalarts/[id]/complete - toggle task completion
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mandalartId } = await params;
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { cellId, action } = await request.json();

  // Verify ownership
  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id, start_date FROM mandalarts WHERE id = ?1',
    [mandalartId]
  );

  if (mandalarts.length === 0 || mandalarts[0].user_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
  }

  const weekNumber = getCurrentWeekNumber(mandalarts[0].start_date);

  if (action === 'complete') {
    // Check if already completed this week
    const existing = await queryD1<CompletionRow>(
      'SELECT id FROM task_completions WHERE cell_id = ?1 AND week_number = ?2',
      [cellId, weekNumber]
    );

    if (existing.length > 0) {
      return NextResponse.json({ error: '이미 완료된 항목입니다' }, { status: 400 });
    }

    const completionId = generateId();
    await executeD1(
      'INSERT INTO task_completions (id, cell_id, mandalart_id, user_id, week_number) VALUES (?1, ?2, ?3, ?4, ?5)',
      [completionId, cellId, mandalartId, user.id, weekNumber]
    );

    // Log activity
    const cells = await queryD1<CellRow>(
      'SELECT content FROM mandalart_cells WHERE id = ?1',
      [cellId]
    );

    const logId = generateId();
    await executeD1(
      'INSERT INTO activity_logs (id, mandalart_id, user_id, cell_id, action, cell_content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      [logId, mandalartId, user.id, cellId, 'completed', cells[0]?.content || '']
    );

    return NextResponse.json({ completed: true, weekNumber });
  } else {
    // Uncomplete
    await executeD1(
      'DELETE FROM task_completions WHERE cell_id = ?1 AND week_number = ?2 AND user_id = ?3',
      [cellId, weekNumber, user.id]
    );

    const cells = await queryD1<CellRow>(
      'SELECT content FROM mandalart_cells WHERE id = ?1',
      [cellId]
    );

    const logId = generateId();
    await executeD1(
      'INSERT INTO activity_logs (id, mandalart_id, user_id, cell_id, action, cell_content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      [logId, mandalartId, user.id, cellId, 'uncompleted', cells[0]?.content || '']
    );

    return NextResponse.json({ completed: false, weekNumber });
  }
}
