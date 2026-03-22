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
    created_at: string;
    nickname?: string;
    completion_count?: number;
    total_tasks?: number;
  };
  showAuthor?: boolean;
}

export default function MandalartCard({ mandalart, showAuthor = false }: Props) {
  const router = useRouter();
  const daysLeft = getDaysRemaining(mandalart.end_date);
  const ended = isMandalartEnded(mandalart.end_date);
  const active = isMandalartActive(mandalart.start_date, mandalart.end_date);
  const totalTasks = mandalart.total_tasks || 0;
  const completionCount = mandalart.completion_count || 0;
  const progress = totalTasks > 0 ? Math.min(100, Math.round((completionCount / totalTasks) * 100)) : 0;

  return (
    <div
      onClick={() => router.push(`/mandalart/${mandalart.id}`)}
      className="card p-5 cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {showAuthor && mandalart.nickname && (
            <p className="text-xs text-[var(--color-text-muted)] mb-1">{mandalart.nickname}</p>
          )}
          <h3 className="font-semibold text-base truncate group-hover:text-[var(--color-primary)] transition-colors">
            {mandalart.title}
          </h3>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 ${
          ended
            ? 'bg-gray-100 text-gray-500'
            : active
            ? 'bg-[var(--color-success-bg)] text-[var(--color-success)]'
            : 'bg-blue-50 text-blue-500'
        }`}>
          {ended ? '종료' : active ? '진행 중' : '예정'}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-light)] mb-4 line-clamp-1">
        {mandalart.center_goal}
      </p>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)] mb-3">
        <span>{formatDate(mandalart.start_date)} ~ {formatDate(mandalart.end_date)}</span>
        {!ended && active && (
          <span className="text-[var(--color-primary)] font-medium">D-{daysLeft}</span>
        )}
      </div>

      <div className="progress-bar mb-2">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{completionCount}회 달성</span>
        <span>{progress}%</span>
      </div>
    </div>
  );
}
