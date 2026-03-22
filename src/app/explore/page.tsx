'use client';

import { useEffect, useState } from 'react';
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
  const [mandalarts, setMandalarts] = useState<Mandalart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/explore')
      .then(r => r.json())
      .then(data => setMandalarts(data.mandalarts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
            둘러보기
          </h1>
          <p className="text-sm text-[var(--color-text-light)] mt-1">
            다른 사람들의 만다라트에서 영감을 얻어보세요
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : mandalarts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-[var(--color-bg-warm)] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-lg font-semibold mb-2">아직 공개된 만다라트가 없어요</h2>
            <p className="text-sm text-[var(--color-text-light)]">
              첫 번째로 만다라트를 공개해보세요!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mandalarts.map(m => (
              <MandalartCard key={m.id} mandalart={m} showAuthor />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
