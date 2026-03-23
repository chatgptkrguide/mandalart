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

export default function HomePage() {
  const router = useRouter();
  const { user, ready, updateNickname } = useUser();
  const [mine, setMine] = useState<Mandalart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user) return;
    fetch('/api/mandalarts')
      .then(r => r.json())
      .then(d => setMine(d.mandalarts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready, user]);

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onNicknameChange={updateNickname} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Top bar */}
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold leading-tight">내 만다라트</h1>
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
