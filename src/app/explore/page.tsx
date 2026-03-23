'use client';

import { useEffect, useState } from 'react';
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

export default function ExplorePage() {
  const { user, ready, logout } = useUser();
  const [list, setList] = useState<Mandalart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mandalarts?mode=explore')
      .then(r => r.json())
      .then(d => setList(d.mandalarts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!ready) return null;

  return (
    <div className="min-h-screen">
      <Header nickname={user?.nickname} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold">둘러보기</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            다른 사람들의 만다라트에서 영감을 얻어보세요
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 anim-fade">
            <p className="text-sm text-[var(--color-text-muted)]">아직 공개된 만다라트가 없어요</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map(m => <MandalartCard key={m.id} mandalart={m} showAuthor />)}
          </div>
        )}
      </main>
    </div>
  );
}
