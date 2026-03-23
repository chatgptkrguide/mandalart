'use client';

import { useState, useEffect, useCallback } from 'react';

export interface UserInfo {
  userId: string;
  nickname: string;
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [ready, setReady] = useState(false);

  // Check if already logged in (session cookie)
  useEffect(() => {
    fetch('/api/user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: '' }), // empty = just check session
    })
      .then(r => {
        if (r.ok) return r.json();
        return null;
      })
      .then(data => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  // Login with name
  const login = useCallback(async (nickname: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    await fetch('/api/user', { method: 'DELETE' }).catch(() => {});
    setUser(null);
  }, []);

  return { user, ready, login, logout };
}
