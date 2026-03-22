'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import {
  CENTER_POSITION,
  SUB_CENTER_POSITIONS,
  SUB_TO_BLOCK,
  getSurrounding,
} from '@/lib/utils';

type Step = 'info' | 'center' | 'sub' | 'tasks' | 'review';

export default function NewMandalartPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('info');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Info
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Step 2: Center goal
  const [centerGoal, setCenterGoal] = useState('');

  // Step 3: Sub goals (8 items)
  const [subGoals, setSubGoals] = useState<Record<number, string>>({});

  // Step 4: Tasks (8 tasks per sub goal)
  const [tasks, setTasks] = useState<Record<number, string>>({});

  // Current sub goal being edited
  const [currentSubIndex, setCurrentSubIndex] = useState(0);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (!data.user) router.push('/'); })
      .catch(() => router.push('/'));
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    // Compose all cells
    const cells: Record<number, string> = {};
    cells[CENTER_POSITION] = centerGoal;

    SUB_CENTER_POSITIONS.forEach((pos) => {
      if (subGoals[pos]) {
        cells[pos] = subGoals[pos];
        // Also set the outer block center to same content
        const outerCenter = SUB_TO_BLOCK[pos];
        if (outerCenter !== undefined) {
          cells[outerCenter] = subGoals[pos];
        }
      }
    });

    // Add tasks
    Object.entries(tasks).forEach(([posStr, content]) => {
      if (content) cells[parseInt(posStr)] = content;
    });

    try {
      const res = await fetch('/api/mandalarts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          centerGoal,
          startDate,
          endDate,
          isPublic,
          cells,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/mandalart/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'info', label: '기본 정보' },
    { key: 'center', label: '핵심 목표' },
    { key: 'sub', label: '하위 목표' },
    { key: 'tasks', label: '실천 항목' },
    { key: 'review', label: '최종 확인' },
  ];

  const currentStepIdx = steps.findIndex(s => s.key === step);

  const canProceed = () => {
    switch (step) {
      case 'info': return title && startDate && endDate;
      case 'center': return centerGoal;
      case 'sub': return Object.values(subGoals).filter(Boolean).length >= 1;
      case 'tasks': return true;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => i < currentStepIdx && setStep(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                  s.key === step
                    ? 'bg-[var(--color-primary)] text-white'
                    : i < currentStepIdx
                    ? 'bg-[var(--color-success-bg)] text-[var(--color-success)] cursor-pointer'
                    : 'bg-[var(--color-border-light)] text-[var(--color-text-muted)]'
                }`}
              >
                <span className="font-medium">{i + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-6 h-px mx-1 ${i < currentStepIdx ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step: Info */}
        {step === 'info' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>기본 정보</h2>
            <p className="text-sm text-[var(--color-text-light)] mb-6">만다라트의 제목과 기간을 설정하세요</p>

            <div className="space-y-4 max-w-md">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-light)] block mb-1.5">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="예: 2026년 상반기 자기계발"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-light)] block mb-1.5">시작일</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-light)] block mb-1.5">종료일</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="input-field"
                    min={startDate}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPublic(!isPublic)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${
                    isPublic ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${
                    isPublic ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
                <span className="text-sm text-[var(--color-text-light)]">
                  {isPublic ? '공개 — 다른 사람이 볼 수 있어요' : '비공개 — 나만 볼 수 있어요'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Center goal */}
        {step === 'center' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>핵심 목표</h2>
            <p className="text-sm text-[var(--color-text-light)] mb-6">만다라트의 가장 중심에 놓일 큰 목표를 적어주세요</p>

            <div className="max-w-md">
              <div className="bg-[var(--color-center)] border-2 border-[var(--color-center-border)] rounded-xl p-6 mb-4">
                <input
                  type="text"
                  value={centerGoal}
                  onChange={e => setCenterGoal(e.target.value)}
                  className="w-full bg-transparent text-center text-lg font-bold outline-none placeholder:text-[var(--color-text-muted)]"
                  placeholder="예: 프로 개발자 되기"
                />
              </div>
              <p className="text-xs text-[var(--color-text-muted)] text-center">
                이 목표를 중심으로 8가지 하위 목표를 설정합니다
              </p>
            </div>
          </div>
        )}

        {/* Step: Sub goals */}
        {step === 'sub' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>하위 목표 8가지</h2>
            <p className="text-sm text-[var(--color-text-light)] mb-6">
              <span className="font-medium text-[var(--color-text)]">&ldquo;{centerGoal}&rdquo;</span>을 달성하기 위한 8가지 영역을 정하세요
            </p>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              {[30, 31, 32, 39, -1, 41, 48, 49, 50].map((pos, i) => {
                if (pos === -1) {
                  return (
                    <div key="center" className="bg-[var(--color-center)] border-2 border-[var(--color-center-border)] rounded-xl p-3 flex items-center justify-center">
                      <span className="text-sm font-bold text-center">{centerGoal}</span>
                    </div>
                  );
                }
                return (
                  <div key={pos} className="bg-[var(--color-sub-center)] border-2 border-[var(--color-sub-center-border)] rounded-xl p-3">
                    <span className="text-[10px] text-[var(--color-text-muted)] block mb-1">
                      목표 {SUB_CENTER_POSITIONS.indexOf(pos) + 1}
                    </span>
                    <input
                      type="text"
                      value={subGoals[pos] || ''}
                      onChange={e => setSubGoals(prev => ({ ...prev, [pos]: e.target.value }))}
                      className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-[var(--color-text-muted)]"
                      placeholder="하위 목표"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Tasks */}
        {step === 'tasks' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>실천 항목</h2>
            <p className="text-sm text-[var(--color-text-light)] mb-6">
              각 하위 목표별로 구체적인 실천 항목을 적어주세요
            </p>

            {/* Sub goal tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {SUB_CENTER_POSITIONS.map((pos, i) => {
                const label = subGoals[pos];
                if (!label) return null;
                return (
                  <button
                    key={pos}
                    onClick={() => setCurrentSubIndex(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                      currentSubIndex === i
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-warm)] text-[var(--color-text-light)] hover:bg-[var(--color-border-light)]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Task inputs for current sub goal */}
            {(() => {
              const subPos = SUB_CENTER_POSITIONS[currentSubIndex];
              const blockCenter = SUB_TO_BLOCK[subPos];
              if (!blockCenter || !subGoals[subPos]) {
                return (
                  <p className="text-sm text-[var(--color-text-muted)]">
                    이 하위 목표가 설정되지 않았습니다. 이전 단계에서 설정해주세요.
                  </p>
                );
              }
              const surrounding = getSurrounding(blockCenter);

              return (
                <div className="space-y-3 max-w-md">
                  <div className="bg-[var(--color-sub-center)] border border-[var(--color-sub-center-border)] rounded-lg px-4 py-2 text-sm font-medium">
                    {subGoals[subPos]}
                  </div>
                  {surrounding.map((taskPos, i) => (
                    <div key={taskPos} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--color-text-muted)] w-4 shrink-0">{i + 1}</span>
                      <input
                        type="text"
                        value={tasks[taskPos] || ''}
                        onChange={e => setTasks(prev => ({ ...prev, [taskPos]: e.target.value }))}
                        className="input-field"
                        placeholder={`실천 항목 ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Step: Review */}
        {step === 'review' && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>최종 확인</h2>
            <p className="text-sm text-[var(--color-text-light)] mb-6">만다라트를 확인하고 저장하세요</p>

            <div className="card p-5 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-sm text-[var(--color-text-light)]">{centerGoal}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isPublic ? 'bg-blue-50 text-blue-500' : 'bg-gray-100 text-gray-500'}`}>
                  {isPublic ? '공개' : '비공개'}
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)]">
                {startDate} ~ {endDate}
              </p>
            </div>

            {/* Mini preview grid */}
            <div className="grid grid-cols-9 gap-[2px] max-w-lg mx-auto mb-6">
              {Array.from({ length: 81 }).map((_, pos) => {
                const isCenter = pos === CENTER_POSITION;
                const isSubCenter = SUB_CENTER_POSITIONS.includes(pos);
                let content = '';

                if (isCenter) content = centerGoal;
                else if (isSubCenter) content = subGoals[pos] || '';
                else content = tasks[pos] || '';

                // Check if this is a block center (outer)
                const outerBlockCenters = Object.values(SUB_TO_BLOCK);
                if (outerBlockCenters.includes(pos)) {
                  const subEntry = Object.entries(SUB_TO_BLOCK).find(([, v]) => v === pos);
                  if (subEntry) content = subGoals[parseInt(subEntry[0])] || '';
                }

                return (
                  <div
                    key={pos}
                    className={`aspect-square rounded-sm flex items-center justify-center text-[5px] leading-tight p-[1px] ${
                      isCenter
                        ? 'bg-[var(--color-center)] border border-[var(--color-center-border)]'
                        : isSubCenter || outerBlockCenters.includes(pos)
                        ? 'bg-[var(--color-sub-center)] border border-[var(--color-sub-center-border)]'
                        : content
                        ? 'bg-[var(--color-task-default)] border border-[var(--color-border-light)]'
                        : 'bg-gray-50 border border-gray-100'
                    }`}
                    title={content}
                  >
                    <span className="truncate">{content.slice(0, 3)}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] mb-2 justify-center">
              <span className="w-3 h-3 rounded-sm bg-[var(--color-center)] border border-[var(--color-center-border)]" /> 핵심 목표
              <span className="w-3 h-3 rounded-sm bg-[var(--color-sub-center)] border border-[var(--color-sub-center-border)] ml-2" /> 하위 목표
              <span className="w-3 h-3 rounded-sm bg-[var(--color-task-default)] border border-[var(--color-border-light)] ml-2" /> 실천 항목
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border-light)]">
          <button
            onClick={() => {
              const prevIdx = currentStepIdx - 1;
              if (prevIdx >= 0) setStep(steps[prevIdx].key);
            }}
            className="btn-outline text-sm"
            disabled={currentStepIdx === 0}
          >
            이전
          </button>

          {step === 'review' ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50"
            >
              {saving ? '저장 중...' : '만다라트 저장'}
            </button>
          ) : (
            <button
              onClick={() => {
                const nextIdx = currentStepIdx + 1;
                if (nextIdx < steps.length) setStep(steps[nextIdx].key);
              }}
              disabled={!canProceed()}
              className="btn-primary text-sm disabled:opacity-50"
            >
              다음
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
