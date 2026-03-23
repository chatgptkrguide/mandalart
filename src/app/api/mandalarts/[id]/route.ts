import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { queryD1, executeD1 } from '@/lib/d1';

interface MandalartRow {
  id: string; user_id: string; title: string; center_goal: string;
  start_date: string; end_date: string; is_public: number;
  created_at: string; updated_at: string; nickname?: string;
}
interface CellRow {
  id: string; mandalart_id: string; position: number;
  content: string; cell_type: string; parent_position: number | null;
}
interface CompletionRow {
  id: string; cell_id: string; completed_at: string;
  week_number: number; note: string | null;
}

// GET /api/mandalarts/[id]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();

  const mandalarts = await queryD1<MandalartRow>(
    `SELECT m.*, u.nickname FROM mandalarts m JOIN users u ON m.user_id = u.id WHERE m.id = ?1`,
    [id]
  );

  if (mandalarts.length === 0) {
    return NextResponse.json({ error: '만다라트를 찾을 수 없습니다' }, { status: 404 });
  }

  const mandalart = mandalarts[0];

  // Private mandalart: only owner can see
  if (!mandalart.is_public && (!session || session.userId !== mandalart.user_id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 });
  }

  const cells = await queryD1<CellRow>(
    'SELECT * FROM mandalart_cells WHERE mandalart_id = ?1 ORDER BY position', [id]
  );
  const completions = await queryD1<CompletionRow>(
    'SELECT * FROM task_completions WHERE mandalart_id = ?1 ORDER BY completed_at DESC', [id]
  );

  return NextResponse.json({
    mandalart: {
      ...mandalart,
      is_public: !!mandalart.is_public,
      isOwner: session?.userId === mandalart.user_id,
    },
    cells,
    completions,
  });
}

// PUT /api/mandalarts/[id] (session-protected, owner only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: '세션이 필요합니다' }, { status: 401 });
  }

  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id FROM mandalarts WHERE id = ?1', [id]
  );
  if (mandalarts.length === 0 || mandalarts[0].user_id !== session.userId) {
    return NextResponse.json({ error: '수정 권한이 없습니다' }, { status: 403 });
  }

  const { title, centerGoal, startDate, endDate, isPublic, cells } = await request.json();

  // Update mandalart metadata
  if (title || centerGoal || startDate || endDate || isPublic !== undefined) {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (title) { updates.push(`title = ?${idx}`); values.push(title); idx++; }
    if (centerGoal) { updates.push(`center_goal = ?${idx}`); values.push(centerGoal); idx++; }
    if (startDate) { updates.push(`start_date = ?${idx}`); values.push(startDate); idx++; }
    if (endDate) { updates.push(`end_date = ?${idx}`); values.push(endDate); idx++; }
    if (isPublic !== undefined) { updates.push(`is_public = ?${idx}`); values.push(isPublic ? 1 : 0); idx++; }

    if (updates.length > 0) {
      values.push(id);
      await executeD1(
        `UPDATE mandalarts SET ${updates.join(', ')}, updated_at = datetime('now') WHERE id = ?${idx}`,
        values
      );
    }
  }

  // Update cells - upsert each cell
  if (cells && typeof cells === 'object') {
    const { CENTER_POSITION, SUB_CENTER_POSITIONS, SUB_TO_BLOCK } = await import('@/lib/utils');

    for (const [posStr, content] of Object.entries(cells as Record<string, string>)) {
      const pos = parseInt(posStr);
      if (isNaN(pos) || pos < 0 || pos > 80) continue;

      let cellType = 'task';
      if (pos === CENTER_POSITION) cellType = 'center';
      else if (SUB_CENTER_POSITIONS.includes(pos)) cellType = 'sub_center';

      let parentPosition: number | null = null;
      if (cellType === 'sub_center') {
        parentPosition = CENTER_POSITION;
      } else if (cellType === 'task') {
        const blockIdx = Math.floor(Math.floor(pos / 9) / 3) * 3 + Math.floor((pos % 9) / 3);
        const blockCenter = ((Math.floor(blockIdx / 3) * 3 + 1) * 9) + (blockIdx % 3 * 3 + 1);
        if (blockCenter !== CENTER_POSITION) {
          for (const [subPos, outerCenter] of Object.entries(SUB_TO_BLOCK)) {
            if (outerCenter === blockCenter) {
              parentPosition = parseInt(subPos);
              break;
            }
          }
        }
      }

      if (content) {
        // Upsert: try update, then insert
        const existing = await queryD1<{ id: string }>(
          'SELECT id FROM mandalart_cells WHERE mandalart_id = ?1 AND position = ?2',
          [id, pos]
        );
        if (existing.length > 0) {
          await executeD1(
            'UPDATE mandalart_cells SET content = ?1, cell_type = ?2, parent_position = ?3 WHERE id = ?4',
            [content, cellType, parentPosition, existing[0].id]
          );
        } else {
          const { generateId } = await import('@/lib/utils');
          await executeD1(
            'INSERT INTO mandalart_cells (id, mandalart_id, position, content, cell_type, parent_position) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
            [generateId(), id, pos, content, cellType, parentPosition]
          );
        }
      } else {
        // Empty content: check for dependent records before deleting
        const existing = await queryD1<{ id: string }>(
          'SELECT id FROM mandalart_cells WHERE mandalart_id = ?1 AND position = ?2',
          [id, pos]
        );
        if (existing.length > 0) {
          const cellId = existing[0].id;
          // Delete dependent completions and logs first
          await executeD1('DELETE FROM task_completions WHERE cell_id = ?1', [cellId]);
          await executeD1('DELETE FROM activity_logs WHERE cell_id = ?1', [cellId]);
          await executeD1('DELETE FROM mandalart_cells WHERE id = ?1', [cellId]);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/mandalarts/[id] (session-protected)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: '세션이 필요합니다' }, { status: 401 });
  }

  const mandalarts = await queryD1<MandalartRow>(
    'SELECT user_id FROM mandalarts WHERE id = ?1', [id]
  );
  if (mandalarts.length === 0 || mandalarts[0].user_id !== session.userId) {
    return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 });
  }

  // Delete dependent data first, then mandalart
  await executeD1('DELETE FROM activity_logs WHERE mandalart_id = ?1', [id]);
  await executeD1('DELETE FROM task_completions WHERE mandalart_id = ?1', [id]);
  await executeD1('DELETE FROM mandalart_cells WHERE mandalart_id = ?1', [id]);
  await executeD1('DELETE FROM mandalarts WHERE id = ?1', [id]);
  return NextResponse.json({ ok: true });
}
