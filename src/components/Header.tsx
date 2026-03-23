'use client';

import { useRouter, usePathname } from 'next/navigation';

interface Props {
  nickname?: string;
  onLogout?: () => void;
}

export default function Header({ nickname, onLogout }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { path: '/', label: '내 만다라트' },
    { path: '/explore', label: '둘러보기' },
  ];

  return (
    <header className="border-b border-[var(--color-border-light)] bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
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

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0">
                <span className="text-white text-[11px] font-semibold">
                  {(nickname || '?')[0]}
                </span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">{nickname}</span>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
              >
                다른 이름
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
