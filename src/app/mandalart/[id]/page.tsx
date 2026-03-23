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
  const { user, ready, updateNickname } = useUser();
  const [m, setM] = useState<MandalartData | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [delModal, setDelModal] = useState(false);
  const [toggling, setToggling] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/mandalarts/${id}?userId=${user.id}`);
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
    try {
      const res = await fetch(`/api/mandalarts/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, cellId, action: isDone ? 'uncomplete' : 'complete' }),
      });
      if (!res.ok) {
        const err = await res.json();
        console.error('toggle failed:', err.error);
      }
      await load();
    } catch { /* network error */ }
    finally { setToggling(prev => { const s = new Set(prev); s.delete(cellId); return s; }); }
  };

  const del = async () => {
    if (!user) return;
    await fetch(`/api/mandalarts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id }),
    });
    router.push('/');
  };

  if (!ready || loading || !m) {
    return (
      <div className="min-h-screen">
        <Header nickname={user?.nickname} onNicknameChange={updateNickname} />
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
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
      <Header nickname={user?.nickname} onNicknameChange={updateNickname} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Title bar */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold truncate">{m.title}</h1>
              <span className={`text-[10px] px-1.5 py-px rounded-full font-medium shrink-0 ${
                ended ? 'bg-gray-100 text-gray-400'
                  : active ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                  : 'bg-blue-50 text-blue-400'
              }`}>
                {ended ? '종료' : active ? '진행 중' : '예정'}
              </span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] truncate">{m.center_goal}</p>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {formatDate(m.start_date)} ~ {formatDate(m.end_date)}
              {active && !ended && <span className="text-[var(--color-primary)] ml-1.5 font-medium">D-{days}</span>}
              {m.nickname && !m.isOwner && <span className="ml-1.5">by {m.nickname}</span>}
            </p>
          </div>
          {m.isOwner && (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => router.push(`/mandalart/${id}/log`)} className="btn btn-ghost btn-sm">로그</button>
              <button onClick={() => setDelModal(true)} className="text-[11px] px-2 py-1 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">삭제</button>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Grid */}
          <div className="lg:col-span-8">
            <div className="card p-3 sm:p-5">
              {m.isOwner && active && (
                <p className="text-[10px] text-[var(--color-text-muted)] mb-3 text-center">
                  실천 항목을 클릭하여 이번 주 달성을 표시하세요
                </p>
              )}
              <MandalartGrid
                cells={cells}
                completions={completions}
                startDate={m.start_date}
                isOwner={m.isOwner && active}
                onToggle={toggle}
                size="md"
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-3">
            {/* Stats */}
            <div className="card p-4">
              <h3 className="text-xs font-semibold mb-3">진행 현황</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-[var(--color-text-muted)]">전체</span>
                    <span className="font-medium">{overallPct}%</span>
                  </div>
                  <div className="bar"><div className="bar-fill" style={{ width: `${overallPct}%` }} /></div>
                </div>
                {active && (
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-[var(--color-text-muted)]">{week}주차</span>
                      <span className="font-medium">{weekPct}%</span>
                    </div>
                    <div className="bar">
                      <div className="bar-fill" style={{
                        width: `${weekPct}%`,
                        background: weekPct === 100 ? 'var(--color-success)' : undefined
                      }} />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[var(--color-border-light)]">
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--color-accent)]">{completions.length}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)]">총 달성</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-[var(--color-primary)]">{week}/{totalW}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)]">주차</p>
                </div>
              </div>
            </div>

            {/* Weekly checklist */}
            {active && m.isOwner && taskCells.length > 0 && (
              <div className="card p-4">
                <h3 className="text-xs font-semibold mb-2">이번 주 할 일</h3>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {taskCells.map(cell => {
                    const done = weekDone.some(c => c.cell_id === cell.id);
                    return (
                      <button
                        key={cell.id}
                        onClick={() => toggle(cell.id, done)}
                        className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] transition-all ${
                          done
                            ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-warm)]'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 text-[7px] font-bold transition-all ${
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

            {/* Recent activity */}
            {completions.length > 0 && (
              <div className="card p-4">
                <h3 className="text-xs font-semibold mb-2">최근 달성</h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {completions.slice(0, 8).map(comp => {
                    const cell = cells.find(c => c.id === comp.cell_id);
                    return (
                      <div key={comp.id} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-1 h-1 rounded-full bg-[var(--color-success)] shrink-0" />
                        <span className="text-[var(--color-text-secondary)] truncate">{cell?.content || '—'}</span>
                        <span className="text-[var(--color-text-muted)] ml-auto shrink-0">{comp.week_number}주차</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete modal */}
        {delModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDelModal(false)} />
            <div className="relative bg-white rounded-xl p-5 w-full max-w-xs anim-pop">
              <h3 className="font-semibold text-sm mb-1.5">만다라트 삭제</h3>
              <p className="text-xs text-[var(--color-text-muted)] mb-5">
                &ldquo;{m.title}&rdquo;과 모든 기록을 삭제합니다.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setDelModal(false)} className="btn btn-ghost btn-sm">취소</button>
                <button onClick={del} className="btn btn-sm bg-red-500 text-white hover:bg-red-600">삭제</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
