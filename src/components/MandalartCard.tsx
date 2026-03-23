'use client';

import { useRouter } from 'next/navigation';
import { formatDate, getDaysRemaining, isMandalartEnded, isMandalartActive } from '@/lib/utils';

interface Props {
  mandalart: {
    id: string;
    title: string;
    center_goal: string;
    start_date: string;
    end_date: string;
    nickname?: string;
    completion_count?: number;
    total_tasks?: number;
  };
  showAuthor?: boolean;
}

export default function MandalartCard({ mandalart, showAuthor }: Props) {
  const router = useRouter();
  const ended = isMandalartEnded(mandalart.end_date);
  const active = isMandalartActive(mandalart.start_date, mandalart.end_date);
  const days = getDaysRemaining(mandalart.end_date);
  const total = mandalart.total_tasks || 0;
  const done = mandalart.completion_count || 0;
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;

  return (
    <button
      onClick={() => router.push(`/mandalart/${mandalart.id}`)}
      className="card card-hover p-4 sm:p-5 text-left w-full group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm sm:text-base truncate group-hover:text-[var(--color-primary)] transition-colors leading-snug">
          {mandalart.title}
        </h3>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 font-medium ${
          ended ? 'bg-gray-100 text-gray-400'
            : active ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
            : 'bg-blue-50 text-blue-400'
        }`}>
          {ended ? '종료' : active ? '진행 중' : '예정'}
        </span>
      </div>

      <p className="text-xs sm:text-sm text-[var(--color-text-muted)] truncate mb-3">{mandalart.center_goal}</p>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-2.5">
        <span>{formatDate(mandalart.start_date)} ~ {formatDate(mandalart.end_date)}</span>
        {active && !ended && <span className="text-[var(--color-primary)] font-medium">D-{days}</span>}
      </div>

      <div className="bar mb-2">
        <div className="bar-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        {showAuthor && mandalart.nickname ? (
          <span>{mandalart.nickname}</span>
        ) : (
          <span>{done}회 달성</span>
        )}
        <span>{pct}%</span>
      </div>
    </button>
  );
}
