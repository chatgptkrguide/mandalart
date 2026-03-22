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
}

interface Props {
  cells: Cell[];
  completions: Completion[];
  startDate: string;
  isOwner: boolean;
  onToggle?: (cellId: string, isCompleted: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
}

export default function MandalartGrid({ cells, completions, startDate, isOwner, onToggle, size = 'md' }: Props) {
  const [bouncing, setBouncing] = useState<string | null>(null);
  const week = getCurrentWeekNumber(startDate);
  const cellMap = new Map(cells.map(c => [c.position, c]));

  const isDone = useCallback((cid: string) =>
    completions.some(c => c.cell_id === cid && c.week_number === week),
  [completions, week]);

  const click = (cell: Cell) => {
    if (!isOwner || cell.cell_type !== 'task' || !cell.content) return;
    setBouncing(cell.id);
    setTimeout(() => setBouncing(null), 250);
    onToggle?.(cell.id, isDone(cell.id));
  };

  const fontSize = size === 'sm' ? 'text-[4px]' : size === 'lg' ? 'text-[0.7rem]' : 'text-[0.6rem]';
  const maxChars = size === 'sm' ? 2 : size === 'lg' ? 8 : 5;

  return (
    <div className="m-grid w-full">
      {Array.from({ length: 81 }).map((_, pos) => {
        const cell = cellMap.get(pos);
        const isCenter = pos === CENTER_POSITION;
        const isSub = SUB_CENTER_POSITIONS.includes(pos);
        const has = cell?.content;
        const done = cell ? isDone(cell.id) : false;
        const col = pos % 9, row = Math.floor(pos / 9);

        return (
          <div
            key={pos}
            onClick={() => cell && click(cell)}
            className={[
              'm-cell',
              fontSize,
              isCenter ? 'center' : isSub ? 'sub' : done ? 'task done' : has ? 'task' : 'empty',
              isOwner && has && cell?.cell_type === 'task' ? 'interactive' : '',
              col === 2 || col === 5 ? 'blk-r' : '',
              row === 2 || row === 5 ? 'blk-b' : '',
              bouncing === cell?.id ? 'anim-check' : '',
            ].filter(Boolean).join(' ')}
            title={has ? cell.content : ''}
          >
            {has ? (
              <span className="truncate w-full px-px">
                {cell.content.length > maxChars ? cell.content.slice(0, maxChars) + '..' : cell.content}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
