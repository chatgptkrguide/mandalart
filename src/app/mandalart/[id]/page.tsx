'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
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

interface Cell {
  id: string;
  position: number;
  content: string;
  cell_type: string;
}

interface Completion {
  id: string;
  cell_id: string;
  week_number: number;
  completed_at: string;
}

interface Mandalart {
  id: string;
  user_id: string;
  title: string;
  center_goal: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  created_at: string;
  nickname?: string;
  isOwner: boolean;
}

export default function MandalartDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [mandalart, setMandalart] = useState<Mandalart | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<Cell | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/mandalarts/${id}`);
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setMandalart(data.mandalart);
      setCells(data.cells);
      setCompletions(data.completions);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleComplete = async (cellId: string, isCompleted: boolean) => {
    try {
      const res = await fetch(`/api/mandalarts/${id}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cellId,
          action: isCompleted ? 'uncomplete' : 'complete',
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch {
      // silent
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/mandalarts/${id}`, { method: 'DELETE' });
      router.push('/dashboard');
    } catch {
      setDeleting(false);
    }
  };

  if (loading || !mandalart) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const ended = isMandalartEnded(mandalart.end_date);
  const active = isMandalartActive(mandalart.start_date, mandalart.end_date);
  const daysLeft = getDaysRemaining(mandalart.end_date);
  const currentWeek = getCurrentWeekNumber(mandalart.start_date);
  const totalWeeks = getTotalWeeks(mandalart.start_date, mandalart.end_date);
  const taskCells = cells.filter(c => c.cell_type === 'task' && c.content);
  const thisWeekCompletions = completions.filter(c => c.week_number === currentWeek);
  const overallProgress = taskCells.length > 0
    ? Math.round((completions.length / (taskCells.length * totalWeeks)) * 100)
    : 0;
  const weekProgress = taskCells.length > 0
    ? Math.round((thisWeekCompletions.length / taskCells.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
                {mandalart.title}
              </h1>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                ended ? 'bg-gray-100 text-gray-500'
                  : active ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                  : 'bg-blue-50 text-blue-500'
              }`}>
                {ended ? '종료' : active ? '진행 중' : '예정'}
              </span>
            </div>
            <p className="text-sm text-[var(--color-text-light)]">{mandalart.center_goal}</p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              {formatDate(mandalart.start_date)} ~ {formatDate(mandalart.end_date)}
              {!ended && active && (
                <span className="text-[var(--color-primary)] ml-2 font-medium">D-{daysLeft}</span>
              )}
              {mandalart.nickname && !mandalart.isOwner && (
                <span className="ml-2">by {mandalart.nickname}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {mandalart.isOwner && (
              <>
                <button
                  onClick={() => router.push(`/mandalart/${id}/log`)}
                  className="btn-outline text-xs px-3 py-2"
                >
                  달성 로그
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-xs px-3 py-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  삭제
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Grid */}
          <div className="lg:col-span-8">
            <div className="card p-4 sm:p-6">
              {mandalart.isOwner && active && (
                <p className="text-xs text-[var(--color-text-muted)] mb-4 text-center">
                  실천 항목을 클릭하면 이번 주 달성 여부를 표시할 수 있어요
                </p>
              )}
              <MandalartGrid
                cells={cells}
                completions={completions}
                mandalartId={id}
                startDate={mandalart.start_date}
                isOwner={mandalart.isOwner && active}
                onToggleComplete={handleToggleComplete}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Stats */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-4">진행 현황</h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-[var(--color-text-light)]">전체 진행률</span>
                    <span className="font-medium">{overallProgress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }} />
                  </div>
                </div>

                {active && (
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-[var(--color-text-light)]">이번 주 ({currentWeek}주차)</span>
                      <span className="font-medium">{weekProgress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-bar-fill"
                        style={{
                          width: `${weekProgress}%`,
                          background: weekProgress === 100
                            ? 'var(--color-success)'
                            : undefined,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-[var(--color-border-light)]">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-accent)]">{completions.length}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">총 달성 횟수</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--color-primary)]">{currentWeek}/{totalWeeks}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">현재 주차</p>
                </div>
              </div>
            </div>

            {/* This week's tasks */}
            {active && mandalart.isOwner && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold mb-3">이번 주 할 일</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {taskCells.map(cell => {
                    const completed = thisWeekCompletions.some(c => c.cell_id === cell.id);
                    return (
                      <button
                        key={cell.id}
                        onClick={() => handleToggleComplete(cell.id, completed)}
                        className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${
                          completed
                            ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-light)] hover:bg-[var(--color-bg-warm)]'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          completed
                            ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white'
                            : 'border-[var(--color-border)]'
                        }`}>
                          {completed && <span className="text-[8px]">✓</span>}
                        </span>
                        <span className={completed ? 'line-through' : ''}>{cell.content}</span>
                      </button>
                    );
                  })}
                  {taskCells.length === 0 && (
                    <p className="text-xs text-[var(--color-text-muted)]">실천 항목이 없습니다</p>
                  )}
                </div>
              </div>
            )}

            {/* Recent completions */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold mb-3">최근 달성</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {completions.slice(0, 10).map(comp => {
                  const cell = cells.find(c => c.id === comp.cell_id);
                  return (
                    <div key={comp.id} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] shrink-0" />
                      <span className="text-[var(--color-text-light)] truncate">{cell?.content || '—'}</span>
                      <span className="text-[var(--color-text-muted)] whitespace-nowrap ml-auto text-[10px]">
                        {comp.week_number}주차
                      </span>
                    </div>
                  );
                })}
                {completions.length === 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">아직 달성 기록이 없어요</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)} />
            <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm animate-scale-in">
              <h3 className="font-semibold text-lg mb-2">만다라트 삭제</h3>
              <p className="text-sm text-[var(--color-text-light)] mb-6">
                &ldquo;{mandalart.title}&rdquo;을 삭제하시겠습니까?<br />
                모든 달성 기록도 함께 삭제됩니다.
              </p>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowDeleteConfirm(false)} className="btn-outline text-sm">
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
