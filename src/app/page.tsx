'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import Header from '@/components/Header';
import MandalartCard from '@/components/MandalartCard';

interface Mandalart {
  id: string;
  title: string;
  center_goal: string;
  start_date: string;
  end_date: string;
  created_at: string;
  nickname?: string;
  completion_count?: number;
  total_tasks?: number;
}

// ─── Onboarding Steps ───
const ONBOARDING = [
  {
    title: '만다라트란?',
    desc: '오타니 쇼헤이가 고등학생 때 사용한 목표 달성법이에요.\n하나의 큰 목표를 9×9 = 81칸으로 쪼개서\n실천 가능한 작은 행동으로 만듭니다.',
    visual: 'concept',
  },
  {
    title: '1단계: 핵심 목표',
    desc: '가장 중심에 이루고 싶은 큰 목표를 적어요.\n이 목표가 만다라트의 출발점이 됩니다.',
    detail: '예시: "프로 개발자 되기", "건강한 몸 만들기"',
    visual: 'step1',
  },
  {
    title: '2단계: 8가지 핵심 영역',
    desc: '핵심 목표를 이루기 위해 키워야 할\n8가지 영역을 정해요. AI가 추천해줄 수도 있어요.',
    detail: '예시: 기술력, 체력관리, 인맥구축, 재무관리 ...',
    visual: 'step2',
  },
  {
    title: '3단계: 실천 항목',
    desc: '각 영역마다 매주 실천할 수 있는\n구체적인 행동 8개를 정해요.',
    detail: '예시: "주 3회 30분 러닝", "매일 알고리즘 1문제"',
    visual: 'step3',
  },
  {
    title: '매주 체크하기',
    desc: '실천 항목을 클릭하면 초록색으로 변해요.\n매주 달성 여부를 체크하고\n기간이 끝나면 성장 기록을 확인하세요.',
    detail: '달성한 항목은 자동으로 로그에 기록됩니다',
    visual: 'check',
  },
];

// Mini visual components for each onboarding step
function OnboardingVisual({ type }: { type: string }) {
  if (type === 'concept') {
    return (
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 bg-[var(--color-center-bg)] border-2 border-[var(--color-center-border)] rounded-lg flex items-center justify-center text-xs font-bold">
          목표
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-text-muted)]">
          <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className={`w-5 h-5 rounded ${
              i === 4 ? 'bg-[var(--color-center-bg)] border border-[var(--color-center-border)]'
                : [1,3,5,7].includes(i) ? 'bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)]'
                : 'bg-[var(--color-cell-bg)] border border-[var(--color-border-light)]'
            }`} />
          ))}
        </div>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[var(--color-text-muted)]">
          <path d="M5 12h14m-7-7l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <div className="grid grid-cols-3 gap-px">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="w-3.5 h-3.5 rounded-sm bg-[var(--color-cell-bg)] border border-[var(--color-border-light)]" />
          ))}
        </div>
      </div>
    );
  }

  if (type === 'step1') {
    return (
      <div className="grid grid-cols-3 gap-1.5 max-w-[140px] mx-auto">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-medium ${
            i === 4 ? 'bg-[var(--color-center-bg)] border-2 border-[var(--color-center-border)] text-[var(--color-center-border)]'
              : 'bg-gray-50 border border-dashed border-gray-200 text-gray-300'
          }`}>
            {i === 4 ? '핵심 목표' : '?'}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'step2') {
    const labels = ['', '', '', '', '핵심 목표', '', '', '', ''];
    const subLabels = ['기술력', '체력', '인맥', '영어', '', '독서', '멘탈', '재무', '포폴'];
    return (
      <div className="grid grid-cols-3 gap-1.5 max-w-[140px] mx-auto">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-medium leading-tight ${
            i === 4 ? 'bg-[var(--color-center-bg)] border-2 border-[var(--color-center-border)]'
              : 'bg-[var(--color-sub-bg)] border-[1.5px] border-[var(--color-sub-border)]'
          }`}>
            {i === 4 ? '핵심 목표' : subLabels[i]}
          </div>
        ))}
      </div>
    );
  }

  if (type === 'step3') {
    return (
      <div className="space-y-1.5 max-w-[200px] mx-auto">
        <div className="bg-[var(--color-sub-bg)] border border-[var(--color-sub-border)] rounded-lg px-3 py-1.5 text-xs font-medium text-center">
          체력관리
        </div>
        {['주 3회 30분 러닝', '매일 스트레칭 15분', '주 2회 근력운동', '매일 물 2L'].map((t, i) => (
          <div key={i} className="flex items-center gap-2 bg-[var(--color-cell-bg)] border border-[var(--color-border-light)] rounded-lg px-3 py-1.5 text-xs">
            <span className="text-[var(--color-text-muted)]">{i + 1}</span>
            <span>{t}</span>
          </div>
        ))}
        <p className="text-[10px] text-[var(--color-text-muted)] text-center">... 총 8개</p>
      </div>
    );
  }

  if (type === 'check') {
    return (
      <div className="space-y-1.5 max-w-[220px] mx-auto">
        {[
          { text: '주 3회 30분 러닝', done: true },
          { text: '매일 스트레칭 15분', done: true },
          { text: '주 2회 근력운동', done: false },
          { text: '매일 물 2L', done: true },
        ].map((item, i) => (
          <div key={i} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm ${
            item.done ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]' : 'bg-[var(--color-bg)] text-[var(--color-text-secondary)]'
          }`}>
            <span className={`w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
              item.done ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' : 'border-[var(--color-border)]'
            }`}>
              {item.done && '✓'}
            </span>
            <span className={item.done ? 'line-through opacity-70' : ''}>{item.text}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

export default function HomePage() {
  const router = useRouter();
  const { user, ready, login, logout } = useUser();
  const [mine, setMine] = useState<Mandalart[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    setLoading(true);
    fetch('/api/mandalarts')
      .then(r => r.json())
      .then(d => setMine(d.mandalarts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setLoginLoading(true);
    await login(nameInput.trim());
    setLoginLoading(false);
  };

  if (!ready) return null;

  // ─── Not logged in: Onboarding + Name input ───
  if (!user) {
    const step = ONBOARDING[onboardingStep];
    const isLast = onboardingStep === ONBOARDING.length - 1;

    return (
      <div className="min-h-screen flex flex-col">
        {/* Onboarding area */}
        {showOnboarding && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="w-full max-w-md anim-fade" key={onboardingStep}>
              {/* Logo */}
              <div className="text-center mb-6">
                <img src="/logo-64.png" alt="만다라트" className="w-12 h-12 rounded-xl mx-auto mb-3" />
                <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>만다라트</h1>
              </div>

              {/* Step content */}
              <div className="card p-6 sm:p-8 mb-6">
                <h2 className="text-lg font-bold text-center mb-2">{step.title}</h2>
                <p className="text-sm text-[var(--color-text-secondary)] text-center whitespace-pre-line leading-relaxed mb-5">
                  {step.desc}
                </p>

                {/* Visual */}
                <div className="py-4">
                  <OnboardingVisual type={step.visual} />
                </div>

                {step.detail && (
                  <p className="text-xs text-[var(--color-text-muted)] text-center mt-4 bg-[var(--color-bg)] rounded-lg py-2 px-3">
                    {step.detail}
                  </p>
                )}
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-1.5 mb-5">
                {ONBOARDING.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setOnboardingStep(i)}
                    className={`rounded-full transition-all ${
                      i === onboardingStep
                        ? 'w-6 h-2 bg-[var(--color-primary)]'
                        : 'w-2 h-2 bg-[var(--color-border)]'
                    }`}
                  />
                ))}
              </div>

              {/* Navigation */}
              <div className="flex gap-2">
                {onboardingStep > 0 && (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep - 1)}
                    className="btn btn-ghost flex-1"
                  >
                    이전
                  </button>
                )}
                {isLast ? (
                  <button
                    onClick={() => setShowOnboarding(false)}
                    className="btn btn-fill btn-lg flex-1"
                  >
                    시작하기
                  </button>
                ) : (
                  <button
                    onClick={() => setOnboardingStep(onboardingStep + 1)}
                    className="btn btn-fill flex-1"
                  >
                    다음
                  </button>
                )}
              </div>

              {/* Skip */}
              {!isLast && (
                <button
                  onClick={() => setShowOnboarding(false)}
                  className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mx-auto block mt-3"
                >
                  건너뛰기
                </button>
              )}
            </div>
          </div>
        )}

        {/* Name input screen (after onboarding or skip) */}
        {!showOnboarding && (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="w-full max-w-sm anim-fade">
              <div className="text-center mb-8">
                <img src="/logo-64.png" alt="만다라트" className="w-14 h-14 rounded-xl mx-auto mb-4" />
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>만다라트</h1>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">이름을 입력하면 바로 시작할 수 있어요</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  className="input text-center text-lg"
                  placeholder="이름 입력"
                  autoFocus
                  maxLength={20}
                />
                <button
                  type="submit"
                  disabled={!nameInput.trim() || loginLoading}
                  className="btn btn-fill btn-lg w-full"
                >
                  {loginLoading ? '접속 중...' : '시작하기'}
                </button>
              </form>

              <p className="text-xs text-[var(--color-text-muted)] text-center mt-4 leading-relaxed">
                같은 이름으로 어디서든 내 만다라트에 접근할 수 있어요
              </p>

              <button
                onClick={() => { setShowOnboarding(true); setOnboardingStep(0); }}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] mx-auto block mt-6"
              >
                사용법 다시 보기
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Logged in: Dashboard ───
  return (
    <div className="min-h-screen">
      <Header nickname={user.nickname} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">{user.nickname}님의 만다라트</h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              {mine.length > 0 ? `${mine.length}개 진행 중` : '목표를 만들어보세요'}
            </p>
          </div>
          <button onClick={() => router.push('/mandalart/new')} className="btn btn-fill">
            + 새로 만들기
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mine.length === 0 ? (
          <div className="flex flex-col items-center py-16 sm:py-20 anim-fade">
            <div className="w-24 h-24 bg-[var(--color-bg-warm)] rounded-2xl flex items-center justify-center mb-6">
              <div className="grid grid-cols-3 gap-1">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`w-5 h-5 rounded ${i === 4 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'}`} />
                ))}
              </div>
            </div>
            <p className="text-base font-medium mb-1">아직 만다라트가 없어요</p>
            <p className="text-sm text-[var(--color-text-muted)] mb-6 text-center leading-relaxed">
              핵심 목표 하나를 정하고<br />8가지로 세분화해보세요
            </p>
            <button onClick={() => router.push('/mandalart/new')} className="btn btn-fill btn-lg">
              첫 만다라트 만들기
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mine.map(m => <MandalartCard key={m.id} mandalart={m} />)}
          </div>
        )}
      </main>
    </div>
  );
}
