import { NextResponse } from 'next/server';
import { queryD1 } from '@/lib/d1';

interface LogRow {
  id: string;
  action: string;
  cell_content: string;
  created_at: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const logs = await queryD1<LogRow>(
    'SELECT * FROM activity_logs WHERE mandalart_id = ?1 ORDER BY created_at DESC LIMIT 200',
    [id]
  );

  return NextResponse.json({ logs });
}
