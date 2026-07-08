import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useHomelabAuth } from '@/lib/homelab/client';
import { useSort, SortableTh, type Accessor } from '@/lib/homelab/useSort';

type Tags = {
  upstream?: string | null;
  authProtected?: boolean;
};

type Row = {
  id: string;
  source: string;
  kind: string;
  name: string; // hostname
  hostIp: string | null; // upstream backend ip
  port: number | null; // upstream backend port
  url: string | null;
  tags: Tags | null;
};

const SORTERS: Record<string, Accessor<Row>> = {
  host: (r) => r.name,
  upstream: (r) => r.tags?.upstream ?? '',
  auth: (r) => (r.tags?.authProtected ? 1 : 0),
};

export default function RoutesPage() {
  const { ready, authedFetch } = useHomelabAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ kind: 'route' });
      if (q) params.set('q', q);
      const res = await authedFetch(`/api/homelab/resources?${params}`);
      const data = await res.json();
      setRows(data.resources ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authedFetch, q]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [ready, load]);

  const { sorted, sort, toggle } = useSort(rows, SORTERS, {
    key: 'host',
    dir: 'asc',
  });

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>homelab routes · boskind.tech</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl">routes</h1>
          <div className="flex gap-2">
            <Link href="/homelab" className="btn btn-sm">← dashboard</Link>
            <Link href="/homelab/services" className="btn btn-sm">services</Link>
            <Link href="/homelab/ports" className="btn btn-sm">ports</Link>
            <Link href="/homelab/stacks" className="btn btn-sm">stacks</Link>
          </div>
        </div>

        <div className="text-sm opacity-70">
          Public hostnames served by Caddy → their internal upstream, and
          whether they sit behind Authentik.
        </div>

        <input
          className="input input-bordered input-sm w-full"
          placeholder="filter by hostname / upstream…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {error ? <div className="alert alert-error text-sm">{error}</div> : null}
        <div className="text-xs opacity-60">
          {loading ? 'loading…' : `${rows.length} routes`}
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <SortableTh label="hostname" sortKey="host" sort={sort} toggle={toggle} />
                <SortableTh label="upstream" sortKey="upstream" sort={sort} toggle={toggle} />
                <SortableTh label="auth" sortKey="auth" sort={sort} toggle={toggle} />
                <th>open</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap font-semibold">{r.name}</td>
                  <td className="font-mono whitespace-nowrap">
                    {r.tags?.upstream ?? ''}
                  </td>
                  <td>
                    {r.tags?.authProtected ? (
                      <span className="badge badge-warning badge-sm">authentik</span>
                    ) : (
                      <span className="badge badge-ghost badge-sm">public</span>
                    )}
                  </td>
                  <td>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary"
                      >
                        open
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
