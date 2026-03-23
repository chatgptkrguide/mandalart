'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserInfo {
  userId: string;
  nickname: string;
}

const OLD_STORAGE_KEY = 'mandalart_user';
const NICK_KEY = 'mandalart_nick';

const adjectives = ['빠른', '느긋한', '용감한', '조용한', '밝은', '따뜻한', '시원한', '대담한', '꾸준한', '활발한'];
const nouns = ['고양이', '토끼', '여우', '곰', '사슴', '다람쥐', '올빼미', '펭귄', '돌고래', '나무늘보'];

function randomNickname(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adj} ${noun}`;
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Check for legacy localStorage user (migration from pre-session system)
    let legacyUserId: string | null = null;
    let legacyNickname: string | null = null;
    try {
      const stored = localStorage.getItem(OLD_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.id) {
          legacyUserId = parsed.id;
          legacyNickname = parsed.nickname || null;
        }
      }
    } catch {}

    // Try saved nickname, then legacy, then random
    let savedNick: string | null = null;
    try { savedNick = localStorage.getItem(NICK_KEY); } catch {}
    const nickname = savedNick || legacyNickname || randomNickname();

    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nickname,
        legacyUserId, // Send old ID for migration
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          // Save nickname for future sessions
          try {
            localStorage.setItem(NICK_KEY, data.user.nickname);
            localStorage.removeItem(OLD_STORAGE_KEY);
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const updateNickname = useCallback((nickname: string) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, nickname } : prev);
    try { localStorage.setItem(NICK_KEY, nickname); } catch {}

    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    }).catch(() => {});
  }, [user]);

  return { user, ready, updateNickname };
}
