'use client';

import { useState, useCallback } from 'react';
import { CENTER_POSITION, SUB_CENTER_POSITIONS, getCurrentWeekNumber } from '@/lib/utils';

interface Cell {
  id: string;
  position: number;
  content: string;
  cell_type: string;
}

interface Completion {
  id: string;
  cell_id: string;
  week_number: number;
  completed_at: string;
}

interface Props {
  cells: Cell[];
  completions: Completion[];
  mandalartId: string;
  startDate: string;
  isOwner: boolean;
  onToggleComplete?: (cellId: string, isCompleted: boolean) => void;
}

export default function MandalartGrid({ cells, completions, mandalartId, startDate, isOwner, onToggleComplete }: Props) {
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);
  const currentWeek = getCurrentWeekNumber(startDate);

  const cellMap = new Map(cells.map(c => [c.position, c]));

  const isCellCompleted = useCallback((cellId: string) => {
    return completions.some(c => c.cell_id === cellId && c.week_number === currentWeek);
  }, [completions, currentWeek]);

  const getCellCompletionCount = useCallback((cellId: string) => {
    return completions.filter(c => c.cell_id === cellId).length;
  }, [completions]);

  const handleCellClick = (cell: Cell) => {
    if (!isOwner || cell.cell_type !== 'task' || !cell.content) return;

    const completed = isCellCompleted(cell.id);
    setAnimatingCell(cell.id);
    setTimeout(() => setAnimatingCell(null), 300);

    onToggleComplete?.(cell.id, completed);
  };

  return (
    <div className="mandalart-grid w-full max-w-2xl mx-auto">
      {Array.from({ length: 81 }).map((_, pos) => {
        const cell = cellMap.get(pos);
        const isCenter = pos === CENTER_POSITION;
        const isSubCenter = SUB_CENTER_POSITIONS.includes(pos);
        const hasContent = cell && cell.content;
        const completed = cell ? isCellCompleted(cell.id) : false;
        const completionCount = cell ? getCellCompletionCount(cell.id) : 0;

        // Block separator classes
        const col = pos % 9;
        const row = Math.floor(pos / 9);
        const blockSepRight = col === 2 || col === 5;
        const blockSepBottom = row === 2 || row === 5;

        return (
          <div
            key={pos}
            onClick={() => cell && handleCellClick(cell)}
            className={`mandalart-cell ${
              isCenter ? 'center' :
              isSubCenter ? 'sub-center' :
              completed ? 'completed task' :
              'task'
            } ${blockSepRight ? 'block-separator-right' : ''} ${
              blockSepBottom ? 'block-separator-bottom' : ''
            } ${animatingCell === cell?.id ? 'animate-check' : ''} ${
              isOwner && cell?.cell_type === 'task' && hasContent ? 'cursor-pointer' : 'cursor-default'
            }`}
            title={hasContent ? `${cell.content}${completionCount > 0 ? ` (${completionCount}회 달성)` : ''}` : ''}
          >
            {hasContent ? (
              <span className="truncate w-full px-0.5">
                {cell.content.length > 6 ? cell.content.slice(0, 6) + '..' : cell.content}
              </span>
            ) : (
              <span className="text-[var(--color-text-muted)] opacity-30">·</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
