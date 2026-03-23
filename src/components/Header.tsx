'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface Props {
  nickname?: string;
  onNicknameChange?: (name: string) => void;
}

export default function Header({ nickname, onNicknameChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(nickname || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const tabs = [
    { path: '/', label: '내 만다라트' },
    { path: '/explore', label: '둘러보기' },
  ];

  // Load access code
  useEffect(() => {
    fetch('/api/user/code')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.code) setAccessCode(d.code); })
      .catch(() => {});
  }, []);

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError('');

    try {
      const res = await fetch('/api/user/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Reload the page to apply new session
      window.location.reload();
    } catch (err: unknown) {
      setCodeError(err instanceof Error ? err.message : '인증 실패');
    } finally {
      setCodeLoading(false);
    }
  };

  return (
    <header className="border-b border-[var(--color-border-light)] bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
          {/* Logo + nav */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button onClick={() => router.push('/')} className="flex items-center gap-2 shrink-0">
              <img src="/logo-64.png" alt="만다라트" className="w-7 h-7 rounded" />
              <span className="font-semibold text-sm sm:text-base tracking-tight">만다라트</span>
            </button>

            <nav className="flex items-center gap-1">
              {tabs.map(t => (
                <button
                  key={t.path}
                  onClick={() => router.push(t.path)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors min-h-[32px] ${
                    pathname === t.path
                      ? 'bg-[var(--color-bg-warm)] text-[var(--color-text)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Code login button */}
            <button
              onClick={() => setShowCodeInput(true)}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)] transition-colors hidden sm:block"
            >
              기기 연결
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <span className="text-white text-[11px] font-semibold">
                    {(nickname || '?')[0]}
                  </span>
                </div>
                <span className="hidden sm:inline text-sm">{nickname}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border-light)] rounded-xl shadow-lg py-1 min-w-[200px] z-50 anim-pop">
                    {/* Nickname edit */}
                    <div className="px-4 py-2.5 border-b border-[var(--color-border-light)]">
                      {editing ? (
                        <form onSubmit={(e) => { e.preventDefault(); onNicknameChange?.(name); setEditing(false); }} className="flex gap-2">
                          <input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="input text-sm py-1 px-2 flex-1"
                            autoFocus
                            maxLength={12}
                          />
                          <button type="submit" className="text-sm text-[var(--color-primary)] font-medium whitespace-nowrap">확인</button>
                        </form>
                      ) : (
                        <button
                          onClick={() => { setName(nickname || ''); setEditing(true); }}
                          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] w-full text-left"
                        >
                          {nickname} <span className="text-[var(--color-text-muted)] text-xs ml-1">변경</span>
                        </button>
                      )}
                    </div>

                    {/* Access code */}
                    {accessCode && (
                      <div className="px-4 py-2.5 border-b border-[var(--color-border-light)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">내 접속 코드</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-semibold text-[var(--color-primary)] bg-[var(--color-bg)] px-2 py-0.5 rounded">
                            {accessCode}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(accessCode);
                              alert('복사되었습니다!');
                            }}
                            className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                          >
                            복사
                          </button>
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">다른 기기에서 이 코드를 입력하세요</p>
                      </div>
                    )}

                    {/* Link device */}
                    <button
                      onClick={() => { setMenuOpen(false); setShowCodeInput(true); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
                    >
                      다른 기기에서 접속 코드 입력
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Code input modal */}
      {showCodeInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setShowCodeInput(false); setCodeError(''); setCodeInput(''); }} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-sm anim-pop">
            <h3 className="font-semibold text-lg mb-1">기기 연결</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-5">
              다른 기기의 접속 코드를 입력하면<br />같은 만다라트를 볼 수 있습니다
            </p>

            <form onSubmit={handleCodeLogin} className="space-y-3">
              <input
                value={codeInput}
                onChange={e => setCodeInput(e.target.value)}
                className="input text-center text-lg font-mono tracking-wider"
                placeholder="예: 호랑이-3942"
                autoFocus
              />

              {codeError && (
                <p className="text-sm text-red-500 bg-red-50 p-2.5 rounded-lg">{codeError}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowCodeInput(false); setCodeError(''); setCodeInput(''); }}
                  className="btn btn-ghost flex-1"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!codeInput.trim() || codeLoading}
                  className="btn btn-fill flex-1"
                >
                  {codeLoading ? '확인 중...' : '연결하기'}
                </button>
              </div>
            </form>

            {accessCode && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border-light)]">
                <p className="text-xs text-[var(--color-text-muted)]">
                  내 접속 코드: <code className="font-mono font-semibold text-[var(--color-primary)]">{accessCode}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
