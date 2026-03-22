'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function DashboardPage() {
  const router = useRouter();
  const [mandalarts, setMandalarts] = useState<Mandalart[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        if (!data.user) {
          router.push('/');
          return;
        }
        return fetch('/api/mandalarts');
      })
      .then(r => r?.json())
      .then(data => {
        if (data?.mandalarts) setMandalarts(data.mandalarts);
      })
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)]">
        <Header />
        <div className="max-w-5xl mx-auto px-6 py-16">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>
              내 만다라트
            </h1>
            <p className="text-sm text-[var(--color-text-light)] mt-1">
              {mandalarts.length > 0
                ? `${mandalarts.length}개의 만다라트를 진행하고 있어요`
                : '첫 번째 만다라트를 만들어보세요'}
            </p>
          </div>
          <button
            onClick={() => router.push('/mandalart/new')}
            className="btn-primary text-sm"
          >
            + 새로 만들기
          </button>
        </div>

        {mandalarts.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-block mb-6">
              <div className="w-24 h-24 bg-[var(--color-bg-warm)] rounded-2xl flex items-center justify-center mx-auto">
                <div className="grid grid-cols-3 gap-1">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-sm ${
                        i === 4 ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <h2 className="text-lg font-semibold mb-2">아직 만다라트가 없어요</h2>
            <p className="text-[var(--color-text-light)] text-sm mb-6">
              핵심 목표를 정하고 9칸씩 세분화하여<br />체계적으로 목표를 달성해보세요
            </p>
            <button
              onClick={() => router.push('/mandalart/new')}
              className="btn-primary"
            >
              첫 만다라트 만들기
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mandalarts.map((m) => (
              <MandalartCard key={m.id} mandalart={m} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
