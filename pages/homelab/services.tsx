import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useHomelabAuth } from '@/lib/homelab/client';
import { useSort, SortableTh, type Accessor } from '@/lib/homelab/useSort';

type Row = {
  id: string;
  source: string;
  kind: string;
  name: string;
  hostIp: string | null;
  port: number | null;
  internalPort: number | null;
  protocol: string | null;
  url: string | null;
  state: string | null;
  stack: string | null;
  image: string | null;
};

const KINDS = ['container', 'vm', 'application', 'service', 'database'] as const;

const SORTERS: Record<string, Accessor<Row>> = {
  name: (r) => r.name,
  kind: (r) => r.kind,
  host: (r) => r.hostIp,
  port: (r) => r.port,
  proto: (r) => r.protocol,
  state: (r) => r.state,
  stack: (r) => r.stack,
  image: (r) => r.image,
  url: (r) => r.url,
};

export default function ServicesPage() {
  const { ready, authedFetch } = useHomelabAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState('');
  const [host, setHost] = useState<string>('');
  const [kind, setKind] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (host) params.set('host', host);
      if (kind) params.set('kind', kind);
      const res = await authedFetch(`/api/homelab/resources?${params}`);
      const data = await res.json();
      setRows(data.resources ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authedFetch, q, host, kind]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [ready, load]);

  const hosts = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) if (r.hostIp) s.add(r.hostIp);
    return Array.from(s).sort();
  }, [rows]);

  const { sorted, sort, toggle } = useSort(rows, SORTERS);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>homelab services · boskind.tech</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl">services</h1>
          <div className="flex gap-2">
            <Link href="/homelab" className="btn btn-sm">← dashboard</Link>
            <Link href="/homelab/ports" className="btn btn-sm">ports</Link>
            <Link href="/homelab/stacks" className="btn btn-sm">stacks</Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            className="input input-bordered input-sm flex-1 min-w-[200px]"
            placeholder="search name / stack / image / url…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="select select-bordered select-sm"
            value={host}
            onChange={(e) => setHost(e.target.value)}
          >
            <option value="">all hosts</option>
            {hosts.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <select
            className="select select-bordered select-sm"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="">all kinds</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>

        {error ? <div className="alert alert-error text-sm">{error}</div> : null}
        <div className="text-xs opacity-60">
          {loading ? 'loading…' : `${rows.length} rows`}
        </div>

        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr>
                <SortableTh label="name" sortKey="name" sort={sort} toggle={toggle} />
                <SortableTh label="kind" sortKey="kind" sort={sort} toggle={toggle} />
                <SortableTh label="host" sortKey="host" sort={sort} toggle={toggle} />
                <SortableTh label="port" sortKey="port" sort={sort} toggle={toggle} />
                <SortableTh label="proto" sortKey="proto" sort={sort} toggle={toggle} />
                <SortableTh label="state" sortKey="state" sort={sort} toggle={toggle} />
                <SortableTh label="stack" sortKey="stack" sort={sort} toggle={toggle} />
                <SortableTh label="image" sortKey="image" sort={sort} toggle={toggle} />
                <SortableTh label="url" sortKey="url" sort={sort} toggle={toggle} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap">{r.name}</td>
                  <td>{r.kind}</td>
                  <td className="whitespace-nowrap">{r.hostIp ?? ''}</td>
                  <td>
                    {r.port ?? ''}
                    {r.internalPort && r.port !== r.internalPort
                      ? ` → ${r.internalPort}`
                      : ''}
                  </td>
                  <td>{r.protocol ?? ''}</td>
                  <td>{r.state ?? ''}</td>
                  <td>{r.stack ?? ''}</td>
                  <td className="max-w-xs truncate">{r.image ?? ''}</td>
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
