'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import Header from '@/components/Header';
import {
  CENTER_POSITION,
  SUB_CENTER_POSITIONS,
  SUB_TO_BLOCK,
  getSurrounding,
} from '@/lib/utils';

type Step = 'info' | 'center' | 'sub' | 'tasks' | 'review';

const STEPS: { key: Step; label: string }[] = [
  { key: 'info', label: '기본 정보' },
  { key: 'center', label: '핵심 목표' },
  { key: 'sub', label: '하위 목표' },
  { key: 'tasks', label: '실천 항목' },
  { key: 'review', label: '확인' },
];

// Sparkle icon for AI button
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z" />
    </svg>
  );
}

export default function NewMandalartPage() {
  const router = useRouter();
  const { user, ready, logout } = useUser();
  const [step, setStep] = useState<Step>('info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('2026년 상반기 자기계발');
  const [startDate, setStartDate] = useState('2026-03-23');
  const [endDate, setEndDate] = useState('2026-06-30');
  const [isPublic, setIsPublic] = useState(true);
  const [centerGoal, setCenterGoal] = useState('');
  const [subGoals, setSubGoals] = useState<Record<number, string>>({});
  const [tasks, setTasks] = useState<Record<number, string>>({});
  const [activeSubIdx, setActiveSubIdx] = useState(0);

  // AI states
  const [aiLoadingSub, setAiLoadingSub] = useState(false);
  const [aiLoadingTask, setAiLoadingTask] = useState<number | null>(null); // sub position being loaded

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const period = startDate && endDate ? `${startDate} ~ ${endDate}` : '';

  const canNext = () => {
    if (step === 'info') return title && startDate && endDate;
    if (step === 'center') return centerGoal;
    if (step === 'sub') return Object.values(subGoals).filter(Boolean).length >= 1;
    return true;
  };

  // ── AI: 하위 목표 8개 추천 ──
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
      let data: { suggestions?: string[]; error?: string };
      try { data = JSON.parse(text); } catch { throw new Error('AI 응답을 파싱할 수 없습니다'); }
      if (!res.ok) throw new Error(data.error || '요청 실패');
      if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
        throw new Error('추천 결과가 비어 있습니다');
      }

      const newSubs: Record<number, string> = {};
      SUB_CENTER_POSITIONS.forEach((pos, i) => {
        if (data.suggestions![i]) newSubs[pos] = data.suggestions![i];
      });
      setSubGoals(prev => ({ ...prev, ...newSubs }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI 추천 실패');
    } finally {
      setAiLoadingSub(false);
    }
  };

  // ── AI: 실천 항목 8개 추천 ──
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
      let data: { suggestions?: string[]; error?: string };
      try { data = JSON.parse(text); } catch { throw new Error('AI 응답을 파싱할 수 없습니다'); }
      if (!res.ok) throw new Error(data.error || '요청 실패');
      if (!Array.isArray(data.suggestions) || data.suggestions.length === 0) {
        throw new Error('추천 결과가 비어 있습니다');
      }

      const surr = getSurrounding(blockCenter);
      setTasks(prev => {
        const updated = { ...prev };
        surr.forEach((pos, i) => {
          if (data.suggestions![i]) updated[pos] = data.suggestions![i];
        });
        return updated;
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'AI 추천 실패');
    } finally {
      setAiLoadingTask(null);
    }
  };

  // ── AI: 모든 하위 목표에 대해 실천 항목 일괄 추천 ──
  const suggestAllTasks = async () => {
    const filledSubs = SUB_CENTER_POSITIONS.filter(p => subGoals[p]);
    for (const pos of filledSubs) {
      await suggestTasks(pos);
    }
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    const cells: Record<number, string> = {};
    cells[CENTER_POSITION] = centerGoal;
    SUB_CENTER_POSITIONS.forEach(pos => {
      if (subGoals[pos]) {
        cells[pos] = subGoals[pos];
        const outer = SUB_TO_BLOCK[pos];
        if (outer !== undefined) cells[outer] = subGoals[pos];
      }
    });
    Object.entries(tasks).forEach(([p, c]) => { if (c) cells[parseInt(p)] = c; });

    try {
      const res = await fetch('/api/mandalarts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, centerGoal, startDate, endDate, isPublic, cells }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/mandalart/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 실패');
      setSaving(false);
    }
  };

  if (!ready) return null;

  const filledSubs = SUB_CENTER_POSITIONS.filter(p => subGoals[p]);

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onLogout={logout} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Steps */}
        <div className="flex items-center gap-0.5 mb-7 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => i < stepIdx && setStep(s.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] whitespace-nowrap font-medium transition-colors ${
                  s.key === step
                    ? 'bg-[var(--color-primary)] text-white'
                    : i < stepIdx
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] cursor-pointer'
                    : 'bg-[var(--color-border-light)] text-[var(--color-text-muted)]'
                }`}
              >
                {i + 1}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-4 h-px mx-0.5 ${i < stepIdx ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Error toast */}
        {error && (
          <div className="mb-4 p-2.5 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
            <p className="text-xs text-red-500">{error}</p>
            <button onClick={() => setError('')} className="text-red-300 hover:text-red-500 text-sm ml-2">×</button>
          </div>
        )}

        {/* ── Step: Info ── */}
        {step === 'info' && (
          <div className="anim-fade space-y-4">
            <div>
              <h2 className="text-base font-bold mb-0.5">기본 정보</h2>
              <p className="text-xs text-[var(--color-text-muted)]">제목과 기간을 설정하세요</p>
            </div>
            <div>
              <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1 block">제목</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="예: 2026년 상반기 자기계발" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1 block">시작일</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="text-[11px] font-medium text-[var(--color-text-secondary)] mb-1 block">종료일</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input" min={startDate} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <button
                type="button"
                onClick={() => setIsPublic(!isPublic)}
                className={`w-8 h-[18px] rounded-full relative transition-colors ${isPublic ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`}
              >
                <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-[2px] transition-all ${isPublic ? 'right-[2px]' : 'left-[2px]'}`} />
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {isPublic ? '공개' : '비공개'}
              </span>
            </label>
          </div>
        )}

        {/* ── Step: Center ── */}
        {step === 'center' && (
          <div className="anim-fade space-y-4">
            <div>
              <h2 className="text-base font-bold mb-0.5">핵심 목표</h2>
              <p className="text-xs text-[var(--color-text-muted)]">만다라트 중심에 놓일 가장 큰 목표</p>
            </div>
            <div className="bg-[var(--color-center-bg)] border-2 border-[var(--color-center-border)] rounded-xl p-5">
              <input
                value={centerGoal}
                onChange={e => setCenterGoal(e.target.value)}
                className="w-full bg-transparent text-center text-base font-bold outline-none placeholder:text-[var(--color-text-muted)]"
                placeholder="예: 프로 개발자 되기"
              />
            </div>
            <p className="text-[10px] text-[var(--color-text-muted)] text-center">이 목표를 8가지 영역으로 나눕니다</p>
          </div>
        )}

        {/* ── Step: Sub goals ── */}
        {step === 'sub' && (
          <div className="anim-fade space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold mb-0.5">핵심 영역 8가지</h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  &ldquo;<span className="font-medium text-[var(--color-text)]">{centerGoal}</span>&rdquo;를 이루기 위해 키워야 할 영역
                  <span className="ml-1 text-[var(--color-primary)]">
                    ({Object.values(subGoals).filter(Boolean).length}/8)
                  </span>
                </p>
                <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5">
                  행동이 아닌 영역을 적으세요 (예: 체력관리, 재무관리, 인맥구축)
                </p>
              </div>
              <button
                onClick={suggestSubGoals}
                disabled={aiLoadingSub || !centerGoal}
                className="btn btn-sm bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600 disabled:opacity-40 shrink-0"
              >
                {aiLoadingSub ? (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI 생성 중...
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <SparkleIcon className="w-3.5 h-3.5" />
                    AI 추천
                  </span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[30, 31, 32, 39, -1, 41, 48, 49, 50].map((pos) => {
                if (pos === -1) {
                  return (
                    <div key="c" className="bg-[var(--color-center-bg)] border-2 border-[var(--color-center-border)] rounded-lg p-2 flex items-center justify-center">
                      <span className="text-xs font-bold text-center leading-tight">{centerGoal}</span>
                    </div>
                  );
                }
                return (
                  <div key={pos} className={`bg-[var(--color-sub-bg)] border-[1.5px] border-[var(--color-sub-border)] rounded-lg p-2 transition-all ${aiLoadingSub ? 'animate-pulse' : ''}`}>
                    <span className="text-[8px] text-[var(--color-text-muted)] block mb-0.5">
                      {SUB_CENTER_POSITIONS.indexOf(pos) + 1}
                    </span>
                    <input
                      value={subGoals[pos] || ''}
                      onChange={e => setSubGoals(p => ({ ...p, [pos]: e.target.value }))}
                      className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-[var(--color-text-muted)]"
                      placeholder="영역명"
                      disabled={aiLoadingSub}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step: Tasks ── */}
        {step === 'tasks' && (
          <div className="anim-fade space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-bold mb-0.5">실천 항목</h2>
                <p className="text-xs text-[var(--color-text-muted)]">각 영역별 매주 체크할 실천 항목 (주기 + 수치 + 행동)</p>
              </div>
              {filledSubs.length > 0 && (
                <button
                  onClick={suggestAllTasks}
                  disabled={aiLoadingTask !== null}
                  className="btn btn-sm bg-gradient-to-r from-violet-500 to-blue-500 text-white hover:from-violet-600 hover:to-blue-600 disabled:opacity-40 shrink-0"
                >
                  {aiLoadingTask !== null ? (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      생성 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <SparkleIcon className="w-3.5 h-3.5" />
                      전체 AI 추천
                    </span>
                  )}
                </button>
              )}
            </div>

            {filledSubs.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">하위 목표를 먼저 설정해주세요</p>
            ) : (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {filledSubs.map((pos, i) => (
                    <button
                      key={pos}
                      onClick={() => setActiveSubIdx(i)}
                      className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap font-medium transition-colors ${
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
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)] rounded-lg px-3 py-1.5 text-xs font-medium flex-1">
                          {subGoals[subPos]}
                        </div>
                        <button
                          onClick={() => suggestTasks(subPos)}
                          disabled={aiLoadingTask !== null}
                          className="ml-2 btn btn-sm text-[10px] bg-violet-50 text-violet-600 hover:bg-violet-100 border border-violet-200 disabled:opacity-40"
                        >
                          {isLoading ? (
                            <span className="w-3 h-3 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
                          ) : (
                            <SparkleIcon className="w-3 h-3" />
                          )}
                        </button>
                      </div>

                      {surr.map((tp, i) => (
                        <div key={tp} className={`flex items-center gap-2 ${isLoading ? 'animate-pulse' : ''}`}>
                          <span className="text-[10px] text-[var(--color-text-muted)] w-3 shrink-0 text-right">{i + 1}</span>
                          <input
                            value={tasks[tp] || ''}
                            onChange={e => setTasks(p => ({ ...p, [tp]: e.target.value }))}
                            className="input text-xs"
                            placeholder={`예: 주 3회 30분 러닝`}
                            disabled={isLoading}
                          />
                        </div>
                      ))}

                      <p className="text-[9px] text-[var(--color-text-muted)] mt-1 pl-5">
                        매주 체크할 수 있는 항목으로 — &ldquo;주 3회 30분 러닝&rdquo; &ldquo;매일 가계부 기록&rdquo; &ldquo;매주 책 1권 완독&rdquo;
                      </p>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        )}

        {/* ── Step: Review ── */}
        {step === 'review' && (
          <div className="anim-fade space-y-4">
            <div>
              <h2 className="text-base font-bold mb-0.5">최종 확인</h2>
              <p className="text-xs text-[var(--color-text-muted)]">내용을 확인하고 저장하세요</p>
            </div>

            <div className="card p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-[var(--color-text-muted)]">{centerGoal}</p>
                </div>
                <span className={`text-[10px] px-1.5 py-px rounded-full font-medium ${isPublic ? 'bg-blue-50 text-blue-400' : 'bg-gray-100 text-gray-400'}`}>
                  {isPublic ? '공개' : '비공개'}
                </span>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">{startDate} ~ {endDate}</p>
            </div>

            {/* Detail review - sub goals with their tasks */}
            <div className="space-y-3">
              {filledSubs.map(subPos => {
                const blockCenter = SUB_TO_BLOCK[subPos];
                if (!blockCenter) return null;
                const surr = getSurrounding(blockCenter);
                const subTasks = surr.map(p => tasks[p]).filter(Boolean);

                return (
                  <div key={subPos} className="card p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-sub-border)]" />
                      <span className="text-xs font-semibold">{subGoals[subPos]}</span>
                      <span className="text-[9px] text-[var(--color-text-muted)]">{subTasks.length}개 항목</span>
                    </div>
                    {subTasks.length > 0 && (
                      <div className="ml-3.5 space-y-0.5">
                        {subTasks.map((t, i) => (
                          <p key={i} className="text-[11px] text-[var(--color-text-secondary)]">· {t}</p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mini grid preview */}
            <div className="grid grid-cols-9 gap-px max-w-xs mx-auto">
              {Array.from({ length: 81 }).map((_, pos) => {
                const isC = pos === CENTER_POSITION;
                const isS = SUB_CENTER_POSITIONS.includes(pos);
                let content = '';
                if (isC) content = centerGoal;
                else if (isS) content = subGoals[pos] || '';
                else {
                  content = tasks[pos] || '';
                  if (!content) {
                    const outerCenters = Object.values(SUB_TO_BLOCK);
                    if (outerCenters.includes(pos)) {
                      const entry = Object.entries(SUB_TO_BLOCK).find(([, v]) => v === pos);
                      if (entry) content = subGoals[parseInt(entry[0])] || '';
                    }
                  }
                }
                return (
                  <div
                    key={pos}
                    className={`aspect-square rounded-[2px] ${
                      isC ? 'bg-[var(--color-center-bg)] border border-[var(--color-center-border)]'
                        : isS || Object.values(SUB_TO_BLOCK).includes(pos)
                        ? 'bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)]'
                        : content ? 'bg-[var(--color-cell-bg)] border border-[var(--color-border-light)]'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                    title={content}
                  />
                );
              })}
            </div>

            <div className="flex gap-3 justify-center text-[10px] text-[var(--color-text-muted)]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--color-center-bg)] border border-[var(--color-center-border)]" />핵심</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)]" />하위</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[var(--color-cell-bg)] border border-[var(--color-border-light)]" />실천</span>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex justify-between mt-7 pt-5 border-t border-[var(--color-border-light)]">
          <button
            onClick={() => { const p = stepIdx - 1; if (p >= 0) setStep(STEPS[p].key); }}
            className="btn btn-ghost btn-sm"
            disabled={stepIdx === 0}
          >
            이전
          </button>
          {step === 'review' ? (
            <button onClick={save} disabled={saving} className="btn btn-fill btn-sm">
              {saving ? '저장 중...' : '저장'}
            </button>
          ) : (
            <button
              onClick={() => { const n = stepIdx + 1; if (n < STEPS.length) setStep(STEPS[n].key); }}
              disabled={!canNext()}
              className="btn btn-fill btn-sm"
            >
              다음
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
