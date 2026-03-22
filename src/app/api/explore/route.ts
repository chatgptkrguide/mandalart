import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1';

interface MandalartRow {
  id: string;
  user_id: string;
  title: string;
  center_goal: string;
  start_date: string;
  end_date: string;
  is_public: number;
  created_at: string;
  nickname: string;
  avatar_url: string | null;
  completion_count: number;
  total_tasks: number;
}

// GET /api/explore - list public mandalarts
export async function GET() {
  const mandalarts = await queryD1<MandalartRow>(
    `SELECT m.*, u.nickname, u.avatar_url,
      (SELECT COUNT(*) FROM task_completions tc WHERE tc.mandalart_id = m.id) as completion_count,
      (SELECT COUNT(*) FROM mandalart_cells mc WHERE mc.mandalart_id = m.id AND mc.cell_type = 'task' AND mc.content != '') as total_tasks
    FROM mandalarts m
    JOIN users u ON m.user_id = u.id
    WHERE m.is_public = 1
    ORDER BY m.created_at DESC
    LIMIT 50`
  );

  return NextResponse.json({ mandalarts });
}
