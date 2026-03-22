'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { formatDateTimeFull } from '@/lib/utils';

interface LogEntry {
  id: string;
  action: string;
  cell_content: string;
  created_at: string;
}

export default function MandalartLogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mandalarts/${id}/logs`)
      .then(r => r.json())
      .then(data => setLogs(data.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    const date = log.created_at.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push(`/mandalart/${id}`)}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            ← 돌아가기
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          달성 로그
        </h1>
        <p className="text-sm text-[var(--color-text-light)] mb-8">
          언제 무엇을 달성했는지 시간순으로 확인하세요
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[var(--color-text-muted)]">아직 활동 기록이 없어요</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([date, dayLogs]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-light)]">
                    {formatDateTimeFull(date + 'T00:00:00').split(' ').slice(0, 3).join(' ')}
                  </h3>
                  <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                </div>

                <div className="ml-4 border-l-2 border-[var(--color-border-light)] pl-5 space-y-3">
                  {dayLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 animate-fade-in">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        log.action === 'completed'
                          ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                          : 'bg-red-50 text-red-400'
                      }`}>
                        <span className="text-[10px]">{log.action === 'completed' ? '✓' : '×'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{log.cell_content}</span>
                          <span className="text-[var(--color-text-muted)]">
                            {log.action === 'completed' ? ' 달성' : ' 취소'}
                          </span>
                        </p>
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                          {formatDateTimeFull(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary stats */}
        {logs.length > 0 && (
          <div className="mt-12 pt-8 border-t border-[var(--color-border-light)]">
            <h3 className="text-sm font-semibold mb-4">요약</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-success)]">
                  {logs.filter(l => l.action === 'completed').length}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">총 달성</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-primary)]">
                  {Object.keys(groupedLogs).length}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">활동일</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-[var(--color-accent)]">
                  {new Set(logs.filter(l => l.action === 'completed').map(l => l.cell_content)).size}
                </p>
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1">달성 항목 수</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
