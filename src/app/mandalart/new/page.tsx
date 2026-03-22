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

export default function NewMandalartPage() {
  const router = useRouter();
  const { user, ready, updateNickname } = useUser();
  const [step, setStep] = useState<Step>('info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [centerGoal, setCenterGoal] = useState('');
  const [subGoals, setSubGoals] = useState<Record<number, string>>({});
  const [tasks, setTasks] = useState<Record<number, string>>({});
  const [activeSubIdx, setActiveSubIdx] = useState(0);

  const stepIdx = STEPS.findIndex(s => s.key === step);

  const canNext = () => {
    if (step === 'info') return title && startDate && endDate;
    if (step === 'center') return centerGoal;
    if (step === 'sub') return Object.values(subGoals).filter(Boolean).length >= 1;
    return true;
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
        body: JSON.stringify({ userId: user.id, title, centerGoal, startDate, endDate, isPublic, cells }),
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

  // Active sub-goals that have content
  const filledSubs = SUB_CENTER_POSITIONS.filter(p => subGoals[p]);

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onNicknameChange={updateNickname} />

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
            <div>
              <h2 className="text-base font-bold mb-0.5">하위 목표 8가지</h2>
              <p className="text-xs text-[var(--color-text-muted)]">
                &ldquo;<span className="font-medium text-[var(--color-text)]">{centerGoal}</span>&rdquo; 달성을 위한 8개 영역
              </p>
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
                  <div key={pos} className="bg-[var(--color-sub-bg)] border-1.5 border-[var(--color-sub-border)] rounded-lg p-2">
                    <span className="text-[8px] text-[var(--color-text-muted)] block mb-0.5">
                      {SUB_CENTER_POSITIONS.indexOf(pos) + 1}
                    </span>
                    <input
                      value={subGoals[pos] || ''}
                      onChange={e => setSubGoals(p => ({ ...p, [pos]: e.target.value }))}
                      className="w-full bg-transparent text-xs font-medium outline-none placeholder:text-[var(--color-text-muted)]"
                      placeholder="목표"
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
            <div>
              <h2 className="text-base font-bold mb-0.5">실천 항목</h2>
              <p className="text-xs text-[var(--color-text-muted)]">각 하위 목표별 구체적인 실천 항목</p>
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

                  return (
                    <div className="space-y-2">
                      <div className="bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)] rounded-lg px-3 py-1.5 text-xs font-medium">
                        {subGoals[subPos]}
                      </div>
                      {surr.map((tp, i) => (
                        <div key={tp} className="flex items-center gap-2">
                          <span className="text-[10px] text-[var(--color-text-muted)] w-3 shrink-0 text-right">{i + 1}</span>
                          <input
                            value={tasks[tp] || ''}
                            onChange={e => setTasks(p => ({ ...p, [tp]: e.target.value }))}
                            className="input text-xs"
                            placeholder={`실천 항목 ${i + 1}`}
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

            {/* Mini grid preview */}
            <div className="grid grid-cols-9 gap-px max-w-sm mx-auto">
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

            {error && <p className="text-xs text-red-500 bg-red-50 p-2.5 rounded-lg">{error}</p>}
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
