import { queryD1, executeD1 } from './d1';

const animals = ['호랑이', '사자', '독수리', '돌고래', '판다', '늑대', '여우', '용', '매', '곰', '거북이', '고래', '펭귄', '코끼리', '기린'];

export function generateAccessCode(): string {
  const animal = animals[Math.floor(Math.random() * animals.length)];
  const num = Math.floor(1000 + Math.random() * 9000); // 4-digit
  return `${animal}-${num}`;
}

export async function getOrCreateAccessCode(userId: string): Promise<string> {
  // Check if user already has a code
  const rows = await queryD1<{ access_code: string | null }>(
    'SELECT access_code FROM users WHERE id = ?1',
    [userId]
  );

  if (rows.length > 0 && rows[0].access_code) {
    return rows[0].access_code;
  }

  // Generate unique code (retry if collision)
  for (let i = 0; i < 10; i++) {
    const code = generateAccessCode();
    try {
      await executeD1('UPDATE users SET access_code = ?1 WHERE id = ?2', [code, userId]);
      return code;
    } catch {
      // Collision, retry
    }
  }

  throw new Error('접속 코드 생성 실패');
}

export async function findUserByAccessCode(code: string): Promise<{ id: string; nickname: string } | null> {
  const rows = await queryD1<{ id: string; nickname: string }>(
    'SELECT id, nickname FROM users WHERE access_code = ?1',
    [code]
  );
  return rows.length > 0 ? rows[0] : null;
}
