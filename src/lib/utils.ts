import { differenceInWeeks, startOfWeek, format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function generateId(): string {
  return crypto.randomUUID();
}

export function getCurrentWeekNumber(startDate: string): number {
  const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
  const now = startOfWeek(new Date(), { weekStartsOn: 1 });
  const diff = differenceInWeeks(now, start);
  if (diff < 0) return 0; // 시작 전
  return diff + 1;
}

export function getTotalWeeks(startDate: string, endDate: string): number {
  const start = startOfWeek(parseISO(startDate), { weekStartsOn: 1 });
  const end = startOfWeek(parseISO(endDate), { weekStartsOn: 1 });
  return Math.max(1, differenceInWeeks(end, start) + 1);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy.MM.dd');
}

export function formatDateKo(dateStr: string): string {
  return format(parseISO(dateStr), 'M월 d일 (EEE)', { locale: ko });
}

export function formatDateTimeFull(dateStr: string): string {
  return format(parseISO(dateStr), 'yyyy년 M월 d일 HH:mm', { locale: ko });
}

export function getDaysRemaining(endDate: string): number {
  const end = parseISO(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function isMandalartActive(startDate: string, endDate: string): boolean {
  const now = new Date();
  return now >= parseISO(startDate) && now <= parseISO(endDate);
}

export function isMandalartEnded(endDate: string): boolean {
  return new Date() > parseISO(endDate);
}

// Mandalart position helpers
export const CENTER_POSITION = 40;

export const SUB_CENTER_POSITIONS = [30, 31, 32, 39, 41, 48, 49, 50];

// Maps position in center block to outer block center
export const SUB_TO_BLOCK: Record<number, number> = {
  30: 10, 31: 13, 32: 16,
  39: 37,          41: 43,
  48: 64, 49: 67, 50: 70,
};

export function getBlockCenter(blockIdx: number): number {
  const br = Math.floor(blockIdx / 3);
  const bc = blockIdx % 3;
  return (br * 3 + 1) * 9 + (bc * 3 + 1);
}

export function getBlockIndex(pos: number): number {
  const r = Math.floor(pos / 9);
  const c = pos % 9;
  return Math.floor(r / 3) * 3 + Math.floor(c / 3);
}

export function getSurrounding(centerPos: number): number[] {
  const row = Math.floor(centerPos / 9);
  const col = centerPos % 9;
  const positions: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < 9 && c >= 0 && c < 9) {
        positions.push(r * 9 + c);
      }
    }
  }
  return positions;
}

export function isBlockCenter(pos: number): boolean {
  return (Math.floor(pos / 9) % 3 === 1) && (pos % 9 % 3 === 1);
}
