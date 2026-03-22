import { NextResponse } from 'next/server';
import { queryD1, executeD1 } from '@/lib/d1';
import { generateId, getCurrentWeekNumber } from '@/lib/utils';

interface MandalartRow { start_date: string; }
interface CellRow { content: string; }
interface CompletionRow { id: string; }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mandalartId } = await params;
  const { userId, cellId, action } = await request.json();

  if (!userId || !cellId) {
    return NextResponse.json({ error: 'missing params' }, { status: 400 });
  }

  const mandalarts = await queryD1<MandalartRow>(
    'SELECT start_date FROM mandalarts WHERE id = ?1', [mandalartId]
  );
  if (mandalarts.length === 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
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
      [generateId(), cellId, mandalartId, userId, weekNumber]
    );

    const cells = await queryD1<CellRow>('SELECT content FROM mandalart_cells WHERE id = ?1', [cellId]);
    await executeD1(
      'INSERT INTO activity_logs (id, mandalart_id, user_id, cell_id, action, cell_content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      [generateId(), mandalartId, userId, cellId, 'completed', cells[0]?.content || '']
    );

    return NextResponse.json({ completed: true, weekNumber });
  } else {
    await executeD1(
      'DELETE FROM task_completions WHERE cell_id = ?1 AND week_number = ?2',
      [cellId, weekNumber]
    );

    const cells = await queryD1<CellRow>('SELECT content FROM mandalart_cells WHERE id = ?1', [cellId]);
    await executeD1(
      'INSERT INTO activity_logs (id, mandalart_id, user_id, cell_id, action, cell_content) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      [generateId(), mandalartId, userId, cellId, 'uncompleted', cells[0]?.content || '']
    );

    return NextResponse.json({ completed: false, weekNumber });
  }
}
