'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserInfo {
  userId: string;
  nickname: string;
}

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
    // POST /api/user will either:
    // - return existing session user (from cookie)
    // - create new user + set session cookie
    const nickname = randomNickname();

    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const updateNickname = useCallback((nickname: string) => {
    if (!user) return;
    setUser(prev => prev ? { ...prev, nickname } : prev);

    fetch('/api/user', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    }).catch(() => {});
  }, [user]);

  return { user, ready, updateNickname };
}
