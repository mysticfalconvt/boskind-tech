import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useHomelabAuth } from '@/lib/homelab/client';

type Row = {
  id: string;
  source: string;
  kind: string;
  name: string;
  hostIp: string | null;
  port: number | null;
  protocol: string | null;
  url: string | null;
  state: string | null;
  stack: string | null;
  image: string | null;
};

export default function StacksPage() {
  const { ready, authedFetch } = useHomelabAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch('/api/homelab/resources');
      const data = await res.json();
      setRows(data.resources ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const grouped = useMemo(() => {
    const g = new Map<string, Row[]>();
    for (const r of rows) {
      const key = r.stack || '(standalone)';
      const arr = g.get(key);
      if (arr) arr.push(r);
      else g.set(key, [r]);
    }
    return Array.from(g.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [rows]);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>homelab stacks · boskind.tech</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl">stacks</h1>
          <div className="flex gap-2">
            <Link href="/homelab" className="btn btn-sm">← dashboard</Link>
            <Link href="/homelab/services" className="btn btn-sm">services</Link>
            <Link href="/homelab/ports" className="btn btn-sm">ports</Link>
          </div>
        </div>

        {error ? <div className="alert alert-error text-sm">{error}</div> : null}
        <div className="text-xs opacity-60">
          {loading ? 'loading…' : `${grouped.length} groups, ${rows.length} rows`}
        </div>

        {grouped.map(([stack, items]) => (
          <details key={stack} className="collapse collapse-arrow bg-base-200">
            <summary className="collapse-title text-lg">
              {stack}{' '}
              <span className="text-sm opacity-60">({items.length})</span>
            </summary>
            <div className="collapse-content">
              <ul className="space-y-1 text-sm">
                {items.map((r) => (
                  <li key={r.id}>
                    <strong>{r.name}</strong>
                    {r.hostIp ? (
                      <>
                        {' '}
                        <code className="opacity-80">
                          {r.hostIp}
                          {r.port ? `:${r.port}` : ''}
                        </code>
                      </>
                    ) : null}
                    {r.state ? (
                      <span className="opacity-60"> [{r.state}]</span>
                    ) : null}
                    {r.image ? (
                      <span className="opacity-60"> — {r.image}</span>
                    ) : null}
                    {r.url ? (
                      <>
                        {' — '}
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="link link-primary"
                        >
                          open
                        </a>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </details>
        ))}
      </div>
    </>
  );
}
