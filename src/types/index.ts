export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar_url?: string;
  created_at: string;
}

export interface Mandalart {
  id: string;
  user_id: string;
  title: string;
  center_goal: string;
  start_date: string;
  end_date: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user?: User;
}

export interface MandalartCell {
  id: string;
  mandalart_id: string;
  position: number; // 0-80 (9x9 grid)
  content: string;
  cell_type: 'center' | 'sub_center' | 'task';
  parent_position?: number; // sub_center or task's parent
}

export interface TaskCompletion {
  id: string;
  cell_id: string;
  mandalart_id: string;
  completed_at: string;
  week_number: number;
  note?: string;
}

export interface ActivityLog {
  id: string;
  mandalart_id: string;
  cell_id: string;
  action: 'completed' | 'uncompleted';
  created_at: string;
  cell_content?: string;
}

// Mandalart grid positions
// The 9x9 grid is divided into 9 blocks of 3x3
// Center block (block 4) has the main goal at center (position 40)
// Each sub-goal at positions around center maps to its own 3x3 block

export const CENTER_POSITION = 40;

export const SUB_CENTER_POSITIONS = [30, 31, 32, 39, 41, 48, 49, 50];

// Maps sub-center position to the center of its corresponding outer block
export const SUB_CENTER_TO_BLOCK_CENTER: Record<number, number> = {
  30: 10, // top-left block center
  31: 13, // top-center block center
  32: 16, // top-right block center
  39: 37, // middle-left block center
  41: 43, // middle-right block center
  48: 64, // bottom-left block center
  49: 67, // bottom-center block center
  50: 70, // bottom-right block center
};

// Get surrounding positions for a given center in a 3x3 block within 9x9 grid
export function getSurroundingPositions(centerPos: number): number[] {
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

export function getBlockIndex(position: number): number {
  const row = Math.floor(position / 9);
  const col = position % 9;
  const blockRow = Math.floor(row / 3);
  const blockCol = Math.floor(col / 3);
  return blockRow * 3 + blockCol;
}

export function getBlockCenter(blockIndex: number): number {
  const blockRow = Math.floor(blockIndex / 3);
  const blockCol = blockIndex % 3;
  return (blockRow * 3 + 1) * 9 + (blockCol * 3 + 1);
}

export function isBlockCenter(position: number): boolean {
  const row = Math.floor(position / 9);
  const col = position % 9;
  return row % 3 === 1 && col % 3 === 1;
}
