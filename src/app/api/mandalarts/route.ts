import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { queryD1, executeD1 } from '@/lib/d1';
import { generateId, CENTER_POSITION, SUB_CENTER_POSITIONS, SUB_TO_BLOCK, getSurrounding } from '@/lib/utils';

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
  completion_count?: number;
  total_tasks?: number;
}

// GET /api/mandalarts - list user's mandalarts
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const mandalarts = await queryD1<MandalartRow>(
    `SELECT m.*, u.nickname, u.avatar_url,
      (SELECT COUNT(*) FROM task_completions tc WHERE tc.mandalart_id = m.id) as completion_count,
      (SELECT COUNT(*) FROM mandalart_cells mc WHERE mc.mandalart_id = m.id AND mc.cell_type = 'task' AND mc.content != '') as total_tasks
    FROM mandalarts m
    JOIN users u ON m.user_id = u.id
    WHERE m.user_id = ?1
    ORDER BY m.created_at DESC`,
    [user.id]
  );

  return NextResponse.json({ mandalarts });
}

// POST /api/mandalarts - create new mandalart
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
  }

  const { title, centerGoal, startDate, endDate, isPublic, cells } = await request.json();

  if (!title || !centerGoal || !startDate || !endDate) {
    return NextResponse.json({ error: '필수 정보를 입력하세요' }, { status: 400 });
  }

  const mandalartId = generateId();

  // Create mandalart
  await executeD1(
    'INSERT INTO mandalarts (id, user_id, title, center_goal, start_date, end_date, is_public) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)',
    [mandalartId, user.id, title, centerGoal, startDate, endDate, isPublic ? 1 : 0]
  );

  // Create cells if provided
  if (cells && typeof cells === 'object') {
    const cellEntries = Object.entries(cells as Record<string, string>);

    for (const [posStr, content] of cellEntries) {
      const pos = parseInt(posStr);
      if (isNaN(pos) || pos < 0 || pos > 80 || !content) continue;

      let cellType = 'task';
      if (pos === CENTER_POSITION) {
        cellType = 'center';
      } else if (SUB_CENTER_POSITIONS.includes(pos)) {
        cellType = 'sub_center';
      }

      // Determine parent
      let parentPosition: number | null = null;
      if (cellType === 'sub_center') {
        parentPosition = CENTER_POSITION;
      } else if (cellType === 'task') {
        // Find which block this cell is in, get that block's center
        const blockIdx = Math.floor(Math.floor(pos / 9) / 3) * 3 + Math.floor((pos % 9) / 3);
        const blockCenter = ((Math.floor(blockIdx / 3) * 3 + 1) * 9) + (blockIdx % 3 * 3 + 1);

        // If the block center is a sub_center position, the parent is the corresponding sub_center in center block
        if (blockCenter !== CENTER_POSITION) {
          // Find which sub_center maps to this outer block
          for (const [subPos, outerCenter] of Object.entries(SUB_TO_BLOCK)) {
            if (outerCenter === blockCenter) {
              parentPosition = parseInt(subPos);
              break;
            }
          }
        }
      }

      const cellId = generateId();
      await executeD1(
        'INSERT INTO mandalart_cells (id, mandalart_id, position, content, cell_type, parent_position) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
        [cellId, mandalartId, pos, content, cellType, parentPosition]
      );
    }
  }

  return NextResponse.json({ id: mandalartId }, { status: 201 });
}
