'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import Header from '@/components/Header';
import { formatDateTimeFull } from '@/lib/utils';

interface LogEntry { id: string; action: string; cell_content: string; created_at: string; }

export default function LogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready, updateNickname } = useUser();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/mandalarts/${id}/logs`)
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const grouped = logs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    const d = log.created_at.split('T')[0];
    (acc[d] ||= []).push(log);
    return acc;
  }, {});

  const completedCount = logs.filter(l => l.action === 'completed').length;
  const activeDays = Object.keys(grouped).length;
  const uniqueItems = new Set(logs.filter(l => l.action === 'completed').map(l => l.cell_content)).size;

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onNicknameChange={updateNickname} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <button onClick={() => router.push(`/mandalart/${id}`)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] mb-5 block">
          ← 돌아가기
        </button>

        <h1 className="text-lg font-bold mb-1">달성 로그</h1>
        <p className="text-xs text-[var(--color-text-muted)] mb-6">언제 무엇을 달성했는지 시간순으로 확인</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-xs text-[var(--color-text-muted)] text-center py-16">아직 기록이 없어요</p>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2 mb-8">
              {[
                { n: completedCount, l: '총 달성', c: 'text-[var(--color-success)]' },
                { n: activeDays, l: '활동일', c: 'text-[var(--color-primary)]' },
                { n: uniqueItems, l: '달성 항목', c: 'text-[var(--color-accent)]' },
              ].map(s => (
                <div key={s.l} className="card p-3 text-center">
                  <p className={`text-xl font-bold ${s.c}`}>{s.n}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)]">{s.l}</p>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div className="space-y-6">
              {Object.entries(grouped).map(([date, dayLogs]) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />
                    <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">
                      {formatDateTimeFull(date + 'T00:00:00').split(' ').slice(0, 3).join(' ')}
                    </span>
                    <div className="flex-1 h-px bg-[var(--color-border-light)]" />
                  </div>
                  <div className="ml-3 border-l border-[var(--color-border-light)] pl-4 space-y-2">
                    {dayLogs.map(log => (
                      <div key={log.id} className="flex items-start gap-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-px ${
                          log.action === 'completed' ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-red-50 text-red-400'
                        }`}>
                          <span className="text-[8px] font-bold">{log.action === 'completed' ? '✓' : '×'}</span>
                        </div>
                        <div>
                          <p className="text-xs">
                            <span className="font-medium">{log.cell_content}</span>
                            <span className="text-[var(--color-text-muted)]"> {log.action === 'completed' ? '달성' : '취소'}</span>
                          </p>
                          <p className="text-[9px] text-[var(--color-text-muted)]">{formatDateTimeFull(log.created_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
