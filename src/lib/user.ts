import { queryD1, executeD1 } from './d1';

interface UserRow {
  id: string;
  nickname: string;
  created_at: string;
}

// Ensure anonymous user exists in DB
export async function ensureUser(userId: string, nickname: string): Promise<void> {
  const existing = await queryD1<UserRow>('SELECT id FROM users WHERE id = ?1', [userId]);
  if (existing.length === 0) {
    await executeD1(
      'INSERT INTO users (id, email, password_hash, nickname) VALUES (?1, ?2, ?3, ?4)',
      [userId, `${userId}@anonymous`, 'none', nickname]
    );
  }
}

export async function updateNickname(userId: string, nickname: string): Promise<void> {
  await executeD1('UPDATE users SET nickname = ?1 WHERE id = ?2', [nickname, userId]);
}
