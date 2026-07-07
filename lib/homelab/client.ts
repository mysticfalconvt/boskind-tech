import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export const HOMELAB_STORAGE_KEY = 'homelab-key';

// Non-redirecting auth check for the nav. Returns true only after we've
// confirmed the stored key still validates on the server — a stale key from
// a machine where the env var has changed shouldn't reveal the nav link.
export function useHomelabAuthed(): boolean {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(HOMELAB_STORAGE_KEY);
    if (!stored) return;
    let cancelled = false;
    fetch('/api/homelab/check', {
      headers: { 'x-homelab-key': stored },
    })
      .then((r) => {
        if (!cancelled) setAuthed(r.ok);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  return authed;
}

// Read the key at mount time (client only). Redirects to /homelab/login when
// the stored key is missing or rejected. Every homelab page uses this — no
// per-page auth boilerplate.
export function useHomelabAuth(): {
  key: string | null;
  ready: boolean;
  authedFetch: (url: string, init?: RequestInit) => Promise<Response>;
  logout: () => void;
} {
  const router = useRouter();
  const [key, setKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(HOMELAB_STORAGE_KEY);
    if (!stored) {
      router.replace('/homelab/login');
      return;
    }
    setKey(stored);
    setReady(true);
  }, [router]);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit) => {
      const res = await fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          'x-homelab-key': key ?? '',
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
      if (res.status === 401 || res.status === 503) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(HOMELAB_STORAGE_KEY);
        }
        router.replace('/homelab/login');
        throw new Error('Unauthorized');
      }
      return res;
    },
    [key, router],
  );

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(HOMELAB_STORAGE_KEY);
    }
    router.replace('/homelab/login');
  }, [router]);

  return { key, ready, authedFetch, logout };
}
