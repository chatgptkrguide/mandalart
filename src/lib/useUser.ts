'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'mandalart_user';

interface LocalUser {
  id: string;
  nickname: string;
}

function generateId(): string {
  return 'u_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const adjectives = ['빠른', '느긋한', '용감한', '조용한', '밝은', '따뜻한', '시원한', '대담한', '꾸준한', '활발한'];
const nouns = ['고양이', '토끼', '여우', '곰', '사슴', '다람쥐', '올빼미', '펭귄', '돌고래', '나무늘보'];

function randomNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export function useUser() {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let parsed: LocalUser;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        parsed = JSON.parse(stored);
        if (!parsed.id || !parsed.nickname) throw new Error('invalid');
      } else {
        throw new Error('no data');
      }
    } catch {
      parsed = { id: generateId(), nickname: randomNickname() };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch {}
    }

    setUser(parsed);

    // Ensure user exists in DB
    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parsed.id, nickname: parsed.nickname }),
    }).catch(() => {});

    setReady(true);
  }, []);

  const updateNickname = useCallback((nickname: string) => {
    if (!user) return;
    const updated = { ...user, nickname };
    setUser(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, nickname }),
    }).catch(() => {});
  }, [user]);

  return { user, ready, updateNickname };
}
