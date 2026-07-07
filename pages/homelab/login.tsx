import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { HOMELAB_STORAGE_KEY } from '@/lib/homelab/client';

export default function HomelabLoginPage() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/homelab/check', {
        headers: { 'x-homelab-key': value },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || `Error ${res.status}`);
        return;
      }
      window.localStorage.setItem(HOMELAB_STORAGE_KEY, value);
      router.replace('/homelab');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Head>
        <title>homelab</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <form
          onSubmit={submit}
          className="card bg-base-200 shadow-lg p-6 w-full max-w-sm space-y-4"
        >
          <h1 className="text-xl font-mono">homelab</h1>
          <input
            type="password"
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="input input-bordered w-full font-mono"
            placeholder="access key"
          />
          {error ? (
            <div className="text-error text-sm font-mono">{error}</div>
          ) : null}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={busy || !value}
          >
            {busy ? 'checking…' : 'unlock'}
          </button>
        </form>
      </div>
    </>
  );
}
