'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import Header from '@/components/Header';
import {
  CENTER_POSITION,
  SUB_CENTER_POSITIONS,
  SUB_TO_BLOCK,
  getSurrounding,
} from '@/lib/utils';

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  );
}

interface Cell { id: string; position: number; content: string; cell_type: string; }

export default function EditMandalartPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user, ready, updateNickname } = useUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'info' | 'goals' | 'tasks'>('info');

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [centerGoal, setCenterGoal] = useState('');
  const [subGoals, setSubGoals] = useState<Record<number, string>>({});
  const [tasks, setTasks] = useState<Record<number, string>>({});
  const [activeSubIdx, setActiveSubIdx] = useState(0);

  // AI states
  const [aiLoadingSub, setAiLoadingSub] = useState(false);
  const [aiLoadingTask, setAiLoadingTask] = useState<number | null>(null);

  const period = startDate && endDate ? `${startDate} ~ ${endDate}` : '';

  // Load existing data
  useEffect(() => {
    if (!ready) return;
    fetch(`/api/mandalarts/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => {
        if (!data.mandalart.isOwner) {
          router.push(`/mandalart/${id}`);
          return;
        }
        const m = data.mandalart;
        setTitle(m.title);
        setStartDate(m.start_date);
        setEndDate(m.end_date);
        setIsPublic(m.is_public);
        setCenterGoal(m.center_goal);

        // Parse cells into subGoals and tasks
        const subs: Record<number, string> = {};
        const tks: Record<number, string> = {};
        (data.cells as Cell[]).forEach(c => {
          if (c.position === CENTER_POSITION) return;
          if (SUB_CENTER_POSITIONS.includes(c.position)) {
            subs[c.position] = c.content;
          } else if (c.cell_type === 'task') {
            tks[c.position] = c.content;
          }
        });
        setSubGoals(subs);
        setTasks(tks);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, ready, router]);

  // AI suggest sub goals
  const suggestSubGoals = async () => {
    if (!centerGoal || aiLoadingSub) return;
    setAiLoadingSub(true);
    setError('');
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sub_goals', centerGoal, period }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error);
      if (!Array.isArray(data.suggestions)) throw new Error('추천 실패');
      const newSubs: Record<number, string> = {};
      SUB_CENTER_POSITIONS.forEach((pos, i) => {
        if (data.suggestions[i]) newSubs[pos] = data.suggestions[i];
      });
      setSubGoals(prev => ({ ...prev, ...newSubs }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI 추천 실패');
    } finally { setAiLoadingSub(false); }
  };

  // AI suggest tasks
  const suggestTasks = async (subPos: number) => {
    const subGoal = subGoals[subPos];
    if (!subGoal || !centerGoal) return;
    const blockCenter = SUB_TO_BLOCK[subPos];
    if (!blockCenter) return;
    setAiLoadingTask(subPos);
    setError('');
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'tasks', centerGoal, subGoal, period }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error);
      if (!Array.isArray(data.suggestions)) throw new Error('추천 실패');
      const surr = getSurrounding(blockCenter);
      setTasks(prev => {
        const updated = { ...prev };
        surr.forEach((pos, i) => { if (data.suggestions[i]) updated[pos] = data.suggestions[i]; });
        return updated;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI 추천 실패');
    } finally { setAiLoadingTask(null); }
  };

  // Save
  const save = async () => {
    setSaving(true);
    setError('');

    const cells: Record<number, string> = {};
    cells[CENTER_POSITION] = centerGoal;
    SUB_CENTER_POSITIONS.forEach(pos => {
      if (subGoals[pos]) {
        cells[pos] = subGoals[pos];
        const outer = SUB_TO_BLOCK[pos];
        if (outer !== undefined) cells[outer] = subGoals[pos];
      } else {
        cells[pos] = '';
        const outer = SUB_TO_BLOCK[pos];
        if (outer !== undefined) cells[outer] = '';
      }
    });
    // Include all possible task positions
    for (const subPos of SUB_CENTER_POSITIONS) {
      const bc = SUB_TO_BLOCK[subPos];
      if (!bc) continue;
      getSurrounding(bc).forEach(tp => {
        cells[tp] = tasks[tp] || '';
      });
    }

    try {
      const res = await fetch(`/api/mandalarts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, centerGoal, startDate, endDate, isPublic, cells }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      router.push(`/mandalart/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 실패');
      setSaving(false);
    }
  };

  if (!ready || loading) {
    return (
      <div className="min-h-screen">
        <Header nickname={user?.nickname} onNicknameChange={updateNickname} />
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const filledSubs = SUB_CENTER_POSITIONS.filter(p => subGoals[p]);
  const tabs = [
    { key: 'info' as const, label: '기본 정보' },
    { key: 'goals' as const, label: '영역/목표' },
    { key: 'tasks' as const, label: '실천 항목' },
  ];

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onNicknameChange={updateNickname} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">만다라트 수정</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{title}</p>
          </div>
          <button onClick={() => router.push(`/mandalart/${id}`)} className="btn btn-ghost btn-sm">취소</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-[var(--color-border-light)] pb-px">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                tab === t.key
                  ? 'bg-white border border-[var(--color-border-light)] border-b-white text-[var(--color-text)] -mb-px'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
            <p className="text-sm text-red-500">{error}</p>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 ml-2">×</button>
          </div>
        )}

        {/* Tab: Info */}
        {tab === 'info' && (
          <div className="anim-fade space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">제목</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" />
            </div>
            <div>
              <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">핵심 목표</label>
              <input value={centerGoal} onChange={e => setCenterGoal(e.target.value)} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">시작일</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-1.5 block">종료일</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" min={startDate} />
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-9 h-5 rounded-full relative transition-colors ${isPublic ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${isPublic ? 'right-0.5' : 'left-0.5'}`} />
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">{isPublic ? '공개' : '비공개'}</span>
            </label>
          </div>
        )}

        {/* Tab: Goals */}
        {tab === 'goals' && (
          <div className="anim-fade space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-text-muted)]">
                핵심 영역 ({Object.values(subGoals).filter(Boolean).length}/8)
              </p>
              <button
                onClick={suggestSubGoals}
                disabled={aiLoadingSub || !centerGoal}
                className="btn btn-sm bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600 disabled:opacity-40"
              >
                {aiLoadingSub ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    생성 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-1"><SparkleIcon className="w-3.5 h-3.5" />AI 추천</span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-sm mx-auto">
              {[30, 31, 32, 39, -1, 41, 48, 49, 50].map((pos) => {
                if (pos === -1) {
                  return (
                    <div key="c" className="bg-[var(--color-center-bg)] border-2 border-[var(--color-center-border)] rounded-xl p-3 flex items-center justify-center">
                      <span className="text-sm font-bold text-center leading-tight">{centerGoal}</span>
                    </div>
                  );
                }
                return (
                  <div key={pos} className={`bg-[var(--color-sub-bg)] border-2 border-[var(--color-sub-border)] rounded-xl p-3 ${aiLoadingSub ? 'animate-pulse' : ''}`}>
                    <span className="text-xs text-[var(--color-text-muted)] block mb-1">{SUB_CENTER_POSITIONS.indexOf(pos) + 1}</span>
                    <input
                      value={subGoals[pos] || ''}
                      onChange={e => setSubGoals(p => ({ ...p, [pos]: e.target.value }))}
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--color-text-muted)]"
                      placeholder="영역명"
                      disabled={aiLoadingSub}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab: Tasks */}
        {tab === 'tasks' && (
          <div className="anim-fade space-y-4">
            {filledSubs.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-8">영역을 먼저 설정해주세요</p>
            ) : (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {filledSubs.map((pos, i) => (
                    <button
                      key={pos}
                      onClick={() => setActiveSubIdx(i)}
                      className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap font-medium transition-colors ${
                        activeSubIdx === i
                          ? 'bg-[var(--color-accent)] text-white'
                          : 'bg-[var(--color-bg-warm)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {subGoals[pos]}
                    </button>
                  ))}
                </div>

                {(() => {
                  const subPos = filledSubs[activeSubIdx];
                  if (!subPos) return null;
                  const blockCenter = SUB_TO_BLOCK[subPos];
                  if (!blockCenter) return null;
                  const surr = getSurrounding(blockCenter);
                  const isLoading = aiLoadingTask === subPos;

                  return (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)] rounded-lg px-3 py-2 text-sm font-medium flex-1">
                          {subGoals[subPos]}
                        </div>
                        <button
                          onClick={() => suggestTasks(subPos)}
                          disabled={aiLoadingTask !== null}
                          className="ml-2 btn btn-sm bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 disabled:opacity-40"
                        >
                          {isLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                          ) : (
                            <SparkleIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {surr.map((tp, i) => (
                        <div key={tp} className={`flex items-center gap-2.5 ${isLoading ? 'animate-pulse' : ''}`}>
                          <span className="text-xs text-[var(--color-text-muted)] w-4 shrink-0 text-right">{i + 1}</span>
                          <input
                            value={tasks[tp] || ''}
                            onChange={e => setTasks(p => ({ ...p, [tp]: e.target.value }))}
                            className="input"
                            placeholder="예: 주 3회 30분 러닝"
                            disabled={isLoading}
                          />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* Save button */}
        <div className="flex justify-end mt-8 pt-5 border-t border-[var(--color-border-light)]">
          <button onClick={save} disabled={saving || !title || !centerGoal} className="btn btn-fill btn-lg">
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </main>
    </div>
  );
}
