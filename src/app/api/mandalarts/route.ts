import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { queryD1, executeD1 } from '@/lib/d1';
import { generateId, CENTER_POSITION, SUB_CENTER_POSITIONS, SUB_TO_BLOCK } from '@/lib/utils';

interface MandalartRow {
  id: string; user_id: string; title: string; center_goal: string;
  start_date: string; end_date: string; is_public: number;
  created_at: string; updated_at: string; nickname?: string;
  completion_count?: number; total_tasks?: number;
}

// GET /api/mandalarts - list own mandalarts, or public ones if no session
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('mode'); // 'explore' for public list

  if (mode === 'explore') {
    const mandalarts = await queryD1<MandalartRow>(
      `SELECT m.*, u.nickname,
        (SELECT COUNT(*) FROM task_completions tc WHERE tc.mandalart_id = m.id) as completion_count,
        (SELECT COUNT(*) FROM mandalart_cells mc WHERE mc.mandalart_id = m.id AND mc.cell_type = 'task' AND mc.content != '') as total_tasks
      FROM mandalarts m JOIN users u ON m.user_id = u.id
      WHERE m.is_public = 1 ORDER BY m.created_at DESC LIMIT 50`
    );
    return NextResponse.json({ mandalarts });
  }

  // List own mandalarts
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ mandalarts: [] });
  }

  const mandalarts = await queryD1<MandalartRow>(
    `SELECT m.*, u.nickname,
      (SELECT COUNT(*) FROM task_completions tc WHERE tc.mandalart_id = m.id) as completion_count,
      (SELECT COUNT(*) FROM mandalart_cells mc WHERE mc.mandalart_id = m.id AND mc.cell_type = 'task' AND mc.content != '') as total_tasks
    FROM mandalarts m JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ?1 ORDER BY m.created_at DESC`,
    [session.userId]
  );

  return NextResponse.json({ mandalarts });
}

// POST /api/mandalarts - create (session-protected)
export async function POST(request: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: '세션이 필요합니다' }, { status: 401 });
  }

  const { title, centerGoal, startDate, endDate, isPublic, cells } = await request.json();

  if (!title || !centerGoal || !startDate || !endDate) {
    return NextResponse.json({ error: '필수 정보를 입력하세요' }, { status: 400 });
  }

  const mandalartId = generateId();

  await executeD1(
    'INSERT INTO mandalarts (id, user_id, title, center_goal, start_date, end_date, is_public) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    [mandalartId, session.userId, title, centerGoal, startDate, endDate, isPublic ? 1 : 0]
  );

  if (cells && typeof cells === 'object') {
    for (const [posStr, content] of Object.entries(cells as Record<string, string>)) {
      const pos = parseInt(posStr);
      if (isNaN(pos) || pos < 0 || pos > 80 || !content) continue;

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

      await executeD1(
        'INSERT INTO mandalart_cells (id, mandalart_id, position, content, cell_type, parent_position) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        [generateId(), mandalartId, pos, content, cellType, parentPosition]
      );
    }
  }

  return NextResponse.json({ id: mandalartId }, { status: 201 });
}
