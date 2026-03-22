'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.user) router.push('/dashboard'); })
      .catch(() => {});
  }, [router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/signin' : '/api/auth/signup';
      const body = isLogin
        ? { email, password }
        : { email, password, nickname: nickname || email.split('@')[0] };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '오류가 발생했습니다';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">M</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">만다라트</span>
        </div>
        <button
          onClick={() => setShowAuth(true)}
          className="btn-primary text-sm"
        >
          시작하기
        </button>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24">
        <div className="grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 animate-fade-in">
            <p className="text-[var(--color-primary)] font-medium text-sm mb-4 tracking-wider uppercase">
              Goal Achievement System
            </p>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              9칸에 담는<br />
              <span className="text-[var(--color-primary)]">나만의 목표</span>
            </h1>
            <p className="text-[var(--color-text-light)] text-lg leading-relaxed mb-8 max-w-lg">
              오타니 쇼헤이가 사용한 만다라트 기법으로 목표를 체계적으로 세분화하고,
              매주 실천을 기록하세요. 팀원들과 함께라면 더 멀리 갈 수 있습니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAuth(true); setIsLogin(false); }}
                className="btn-primary text-base px-8 py-3"
              >
                무료로 시작하기
              </button>
              <button
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-outline text-base px-6 py-3"
              >
                어떻게 쓰나요?
              </button>
            </div>
          </div>
          <div className="md:col-span-5">
            <div className="relative">
              {/* Mini mandalart preview */}
              <div className="bg-white rounded-2xl p-5 shadow-lg border border-[var(--color-border-light)]">
                <div className="grid grid-cols-9 gap-[2px]">
                  {Array.from({ length: 81 }).map((_, i) => {
                    const row = Math.floor(i / 9);
                    const col = i % 9;
                    const isCenter = row === 4 && col === 4;
                    const isSubCenter = (row % 3 === 1 && col % 3 === 1) && !isCenter;
                    const completed = [2, 11, 19, 28, 37, 55, 63, 72].includes(i);

                    return (
                      <div
                        key={i}
                        className={`aspect-square rounded-sm transition-all duration-300 ${
                          isCenter
                            ? 'bg-[var(--color-center)] border border-[var(--color-center-border)]'
                            : isSubCenter
                            ? 'bg-[var(--color-sub-center)] border border-[var(--color-sub-center-border)]'
                            : completed
                            ? 'bg-[var(--color-success-light)] border border-[var(--color-success)]'
                            : 'bg-[var(--color-task-default)] border border-[var(--color-border-light)]'
                        }`}
                        style={{ animationDelay: `${i * 15}ms` }}
                      />
                    );
                  })}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">진행률</p>
                    <p className="font-semibold text-sm">32%</p>
                  </div>
                  <div className="progress-bar w-32">
                    <div className="progress-bar-fill" style={{ width: '32%' }} />
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--color-primary)] opacity-5 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-16 h-16 border-2 border-[var(--color-accent)] opacity-10 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-[var(--color-bg-warm)] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            이렇게 사용해요
          </h2>
          <p className="text-[var(--color-text-light)] mb-12">세 단계면 충분합니다</p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: '핵심 목표 설정',
                desc: '가장 중심에 이루고 싶은 큰 목표를 적습니다. 이 목표가 만다라트의 핵심이 됩니다.',
                accent: 'border-l-4 border-l-[var(--color-center-border)]',
              },
              {
                step: '02',
                title: '8가지로 세분화',
                desc: '핵심 목표를 달성하기 위한 8가지 하위 목표를 설정하고, 각각 다시 8개의 실천 항목으로 나눕니다.',
                accent: 'border-l-4 border-l-[var(--color-sub-center-border)]',
              },
              {
                step: '03',
                title: '실천하고 기록',
                desc: '매주 실천한 항목을 체크하고, 달성 기록이 자동으로 쌓입니다. 기간이 끝나면 성장 로그를 확인하세요.',
                accent: 'border-l-4 border-l-[var(--color-success)]',
              },
            ].map((item) => (
              <div key={item.step} className={`bg-white rounded-xl p-6 ${item.accent}`}>
                <span className="text-3xl font-bold text-[var(--color-border)] block mb-3">
                  {item.step}
                </span>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--color-text-light)] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-5xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              함께하면<br />더 강력해요
            </h2>
            <ul className="space-y-4">
              {[
                '팀원들의 만다라트를 둘러보고 서로 영감을 주세요',
                '여러 개의 만다라트를 동시에 진행할 수 있어요',
                '기간을 정하고 매주 실천 여부를 체크해요',
                '완료된 항목은 초록색으로 한눈에 파악',
                '달성 로그로 나의 성장 과정을 돌아봐요',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[var(--color-success-bg)] text-[var(--color-success)] flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                    ✓
                  </span>
                  <span className="text-[var(--color-text-light)] leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-[var(--color-bg-dark)] text-white rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <div className="font-mono text-xs space-y-2 text-gray-300">
              <p><span className="text-green-400">→</span> 3월 3주차 실천 기록</p>
              <p className="ml-4 text-gray-500">───────────────</p>
              <p className="ml-4">✅ 매일 영어 30분 듣기</p>
              <p className="ml-4">✅ 주 3회 운동하기</p>
              <p className="ml-4">⬜ 독서 1권 완독</p>
              <p className="ml-4">✅ 코딩 프로젝트 진행</p>
              <p className="ml-4 text-gray-500">───────────────</p>
              <p><span className="text-yellow-400">→</span> 이번 주 달성률: <span className="text-green-400">75%</span></p>
              <p><span className="text-blue-400">→</span> 전체 진행률: <span className="text-blue-400">42%</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-bg-dark)] py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-white text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            목표는 적는 순간 시작됩니다
          </h2>
          <p className="text-gray-400 mb-8">
            지금 바로 나만의 만다라트를 만들어보세요
          </p>
          <button
            onClick={() => { setShowAuth(true); setIsLogin(false); }}
            className="btn-primary text-base px-10 py-3.5"
          >
            만다라트 만들기
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 text-center text-sm text-[var(--color-text-muted)]">
        <p>© 2026 만다라트. 목표를 실현하는 9칸의 힘.</p>
      </footer>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAuth(false)} />
          <div className="relative bg-white rounded-2xl p-8 w-full max-w-md animate-scale-in">
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xl"
            >
              ×
            </button>

            <h2 className="text-xl font-bold mb-1">
              {isLogin ? '다시 오셨군요' : '만다라트 시작하기'}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              {isLogin ? '이메일로 로그인하세요' : '계정을 만들고 목표를 세워보세요'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-light)] block mb-1.5">닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="input-field"
                    placeholder="팀에서 보여질 이름"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-[var(--color-text-light)] block mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--color-text-light)] block mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="6자 이상"
                  minLength={6}
                  required
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-center disabled:opacity-50"
              >
                {loading ? '처리 중...' : isLogin ? '로그인' : '가입하기'}
              </button>
            </form>

            <p className="text-center text-sm text-[var(--color-text-muted)] mt-4">
              {isLogin ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[var(--color-primary)] font-medium hover:underline"
              >
                {isLogin ? '가입하기' : '로그인'}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
