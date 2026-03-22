'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  nickname: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => { if (data.user) setUser(data.user); })
      .catch(() => {});
  }, []);

  const handleSignOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: '내 만다라트' },
    { href: '/mandalart/new', label: '새로 만들기' },
    { href: '/explore', label: '둘러보기' },
  ];

  return (
    <header className="border-b border-[var(--color-border-light)] bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2"
          >
            <div className="w-7 h-7 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">M</span>
            </div>
            <span className="font-semibold tracking-tight hidden sm:block">만다라트</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(item => (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                  pathname === item.href
                    ? 'bg-[var(--color-bg-warm)] text-[var(--color-text)] font-medium'
                    : 'text-[var(--color-text-light)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--color-bg)] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user.nickname.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm hidden sm:block">{user.nickname}</span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-[var(--color-border-light)] rounded-xl shadow-lg py-1 min-w-[160px] animate-scale-in">
                    <div className="md:hidden">
                      {navItems.map(item => (
                        <button
                          key={item.href}
                          onClick={() => { router.push(item.href); setMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-light)] hover:bg-[var(--color-bg)]"
                        >
                          {item.label}
                        </button>
                      ))}
                      <div className="border-t border-[var(--color-border-light)] my-1" />
                    </div>
                    <div className="px-4 py-2 border-b border-[var(--color-border-light)]">
                      <p className="text-xs text-[var(--color-text-muted)]">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
