'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import Header from '@/components/Header';
import MandalartGrid from '@/components/MandalartGrid';
import {
  formatDate,
  getDaysRemaining,
  isMandalartEnded,
  isMandalartActive,
  getCurrentWeekNumber,
  getTotalWeeks,
} from '@/lib/utils';

interface Cell { id: string; position: number; content: string; cell_type: string; }
interface Completion { id: string; cell_id: string; week_number: number; completed_at: string; }
interface MandalartData {
  id: string; user_id: string; title: string; center_goal: string;
  start_date: string; end_date: string; is_public: boolean;
  nickname?: string; isOwner: boolean;
}

export default function MandalartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready, logout } = useUser();
  const [m, setM] = useState<MandalartData | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [delModal, setDelModal] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/mandalarts/${id}`);
      if (!res.ok) { router.push('/'); return; }
      const data = await res.json();
      setM(data.mandalart);
      setCells(data.cells);
      setCompletions(data.completions);
    } catch { router.push('/'); }
    finally { setLoading(false); }
  }, [id, user, router]);

  useEffect(() => { if (ready && user) load(); }, [ready, user, load]);

  const toggle = async (cellId: string, isDone: boolean) => {
    if (!user || toggling.has(cellId)) return;
    setToggling(prev => new Set(prev).add(cellId));

    // Optimistic update
    const curWeek = m ? getCurrentWeekNumber(m.start_date) : 0;
    if (isDone) {
      setCompletions(prev => prev.filter(c => !(c.cell_id === cellId && c.week_number === curWeek)));
    } else {
      setCompletions(prev => [...prev, { id: 'temp', cell_id: cellId, week_number: curWeek, completed_at: new Date().toISOString() }]);
    }

    try {
      const res = await fetch(`/api/mandalarts/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellId, action: isDone ? 'uncomplete' : 'complete' }),
      });
      if (!res.ok) {
        await load(); // Revert on failure
      }
      // Success: keep optimistic update, no reload needed
    } catch {
      await load(); // Revert on network error
    }
    finally { setToggling(prev => { const s = new Set(prev); s.delete(cellId); return s; }); }
  };

  const del = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/mandalarts/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error();
      router.push('/');
    } catch {
      // Show error if delete fails
      alert('삭제에 실패했습니다. 다시 시도해주세요.');
    }
  };

  if (!ready || loading || !m) {
    return (
      <div className="min-h-screen">
        <Header nickname={user?.nickname} onLogout={logout} />
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const ended = isMandalartEnded(m.end_date);
  const active = isMandalartActive(m.start_date, m.end_date);
  const days = getDaysRemaining(m.end_date);
  const week = getCurrentWeekNumber(m.start_date);
  const totalW = getTotalWeeks(m.start_date, m.end_date);
  const taskCells = cells.filter(c => c.cell_type === 'task' && c.content);
  const weekDone = completions.filter(c => c.week_number === week);
  const overallPct = taskCells.length > 0
    ? Math.round((completions.length / (taskCells.length * totalW)) * 100) : 0;
  const weekPct = taskCells.length > 0
    ? Math.round((weekDone.length / taskCells.length) * 100) : 0;

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Title bar */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6 sm:mb-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{m.title}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                ended ? 'bg-gray-100 text-gray-400'
                  : active ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                  : 'bg-blue-50 text-blue-400'
              }`}>
                {ended ? '종료' : active ? '진행 중' : '예정'}
              </span>
            </div>
            <p className="text-sm sm:text-base text-[var(--color-text-muted)] truncate">{m.center_goal}</p>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {formatDate(m.start_date)} ~ {formatDate(m.end_date)}
              {active && !ended && <span className="text-[var(--color-primary)] ml-2 font-medium">D-{days}</span>}
              {m.nickname && !m.isOwner && <span className="ml-2">by {m.nickname}</span>}
            </p>
          </div>
          {m.isOwner && (
            <div className="flex gap-2 shrink-0">
              <button onClick={() => router.push(`/mandalart/${id}/edit`)} className="btn btn-fill btn-sm">수정</button>
              <button onClick={() => router.push(`/mandalart/${id}/log`)} className="btn btn-ghost btn-sm">달성 로그</button>
              <button onClick={() => setDelModal(true)} className="btn btn-sm text-red-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200">삭제</button>
            </div>
          )}
        </div>

        {/* Stats bar - compact horizontal */}
        <div className="card p-4 sm:p-5 mb-6">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-center gap-3 min-w-[140px]">
              <span className="text-sm text-[var(--color-text-muted)]">전체</span>
              <div className="bar flex-1 min-w-[80px]"><div className="bar-fill" style={{ width: `${overallPct}%` }} /></div>
              <span className="text-sm font-semibold w-10 text-right">{overallPct}%</span>
            </div>
            {active && (
              <div className="flex items-center gap-3 min-w-[140px]">
                <span className="text-sm text-[var(--color-text-muted)]">{week}주차</span>
                <div className="bar flex-1 min-w-[80px]">
                  <div className="bar-fill" style={{ width: `${weekPct}%`, background: weekPct === 100 ? 'var(--color-success)' : undefined }} />
                </div>
                <span className="text-sm font-semibold w-10 text-right">{weekPct}%</span>
              </div>
            )}
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-[var(--color-accent)]">{completions.length}</span>
                <span className="text-sm text-[var(--color-text-muted)]">달성</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold text-[var(--color-primary)]">{week}/{totalW}</span>
                <span className="text-sm text-[var(--color-text-muted)]">주차</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mandalart grid - full width */}
        <div className="card p-2 sm:p-6 md:p-8">
          {m.isOwner && active && (
            <p className="text-sm text-[var(--color-text-muted)] mb-5 text-center">
              실천 항목을 클릭하여 이번 주 달성을 표시하세요
            </p>
          )}
          <MandalartGrid
            cells={cells}
            completions={completions}
            startDate={m.start_date}
            isOwner={m.isOwner && active}
            onToggle={toggle}
          />
        </div>

        {/* Weekly checklist + Recent - below grid */}
        {(active && m.isOwner && taskCells.length > 0) || completions.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4 mt-6">
            {active && m.isOwner && taskCells.length > 0 && (
              <div className="card p-5">
                <h3 className="text-base font-semibold mb-3">이번 주 할 일</h3>
                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {taskCells.map(cell => {
                    const done = weekDone.some(c => c.cell_id === cell.id);
                    return (
                      <button
                        key={cell.id}
                        onClick={() => toggle(cell.id, done)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          done
                            ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)] active:bg-[var(--color-bg-warm)]'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                          done ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' : 'border-[var(--color-border)]'
                        }`}>
                          {done && '✓'}
                        </span>
                        <span className={done ? 'line-through opacity-70' : ''}>{cell.content}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {completions.length > 0 && (
              <div className="card p-5">
                <h3 className="text-base font-semibold mb-3">최근 달성</h3>
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {completions.slice(0, 12).map(comp => {
                    const cell = cells.find(c => c.id === comp.cell_id);
                    return (
                      <div key={comp.id} className="flex items-center gap-2.5 text-sm">
                        <span className="w-2 h-2 rounded-full bg-[var(--color-success)] shrink-0" />
                        <span className="text-[var(--color-text-secondary)] truncate">{cell?.content || '—'}</span>
                        <span className="text-[var(--color-text-muted)] ml-auto shrink-0 text-xs">{comp.week_number}주차</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Delete modal */}
        {delModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDelModal(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm anim-pop">
              <h3 className="font-semibold text-lg mb-2">만다라트 삭제</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6">
                &ldquo;{m.title}&rdquo;과 모든 기록을 삭제합니다.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDelModal(false)} className="btn btn-ghost">취소</button>
                <button onClick={del} className="btn bg-red-500 text-white hover:bg-red-600">삭제</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
