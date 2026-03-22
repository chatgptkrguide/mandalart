'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

interface Props {
  nickname?: string;
  onNicknameChange?: (name: string) => void;
}

export default function Header({ nickname, onNicknameChange }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(nickname || '');

  const tabs = [
    { path: '/', label: '내 만다라트' },
    { path: '/explore', label: '둘러보기' },
  ];

  return (
    <header className="border-b border-[var(--color-border-light)] bg-white/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="h-12 flex items-center justify-between">
          {/* Logo + nav */}
          <div className="flex items-center gap-5">
            <button onClick={() => router.push('/')} className="flex items-center gap-1.5 shrink-0">
              <div className="w-6 h-6 bg-[var(--color-primary)] rounded flex items-center justify-center">
                <span className="text-white font-bold text-[10px]">M</span>
              </div>
              <span className="font-semibold text-sm tracking-tight">만다라트</span>
            </button>

            <nav className="flex items-center gap-0.5">
              {tabs.map(t => (
                <button
                  key={t.path}
                  onClick={() => router.push(t.path)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
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

          {/* Nickname */}
          <div className="flex items-center gap-2">
            {editing ? (
              <form onSubmit={(e) => { e.preventDefault(); onNicknameChange?.(name); setEditing(false); }} className="flex items-center gap-1.5">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input text-xs w-24 py-1 px-2"
                  autoFocus
                  maxLength={12}
                />
                <button type="submit" className="text-[10px] text-[var(--color-primary)] font-medium">확인</button>
              </form>
            ) : (
              <button
                onClick={() => { setName(nickname || ''); setEditing(true); }}
                className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                title="닉네임 변경"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center shrink-0">
                  <span className="text-white text-[9px] font-semibold">
                    {(nickname || '?')[0]}
                  </span>
                </div>
                <span className="hidden sm:inline">{nickname}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
