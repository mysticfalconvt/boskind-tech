import { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useHomelabAuth } from '@/lib/homelab/client';

type PortRow = {
  host: string;
  port: number;
  protocol: string;
  names: string[];
};

type PortsResponse = {
  snapshotId: string | null;
  takenAt: string | null;
  byHost: Record<string, PortRow[]>;
  freeInRange: { host: string; lo: number; hi: number; free: number[] } | null;
};

export default function PortsPage() {
  const { ready, authedFetch } = useHomelabAuth();
  const [data, setData] = useState<PortsResponse | null>(null);
  const [rangeLo, setRangeLo] = useState(3000);
  const [rangeHi, setRangeHi] = useState(3100);
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (rangeHost?: string) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (rangeHost) {
          params.set('host', rangeHost);
          params.set('rangeLo', String(rangeLo));
          params.set('rangeHi', String(rangeHi));
        }
        const res = await authedFetch(`/api/homelab/ports?${params}`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [authedFetch, rangeLo, rangeHi],
  );

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  const hosts = useMemo(() => Object.keys(data?.byHost ?? {}).sort(), [data]);

  if (!ready) return null;

  return (
    <>
      <Head>
        <title>homelab ports · boskind.tech</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl">ports</h1>
          <div className="flex gap-2">
            <Link href="/homelab" className="btn btn-sm">← dashboard</Link>
            <Link href="/homelab/services" className="btn btn-sm">services</Link>
            <Link href="/homelab/stacks" className="btn btn-sm">stacks</Link>
          </div>
        </div>

        {error ? <div className="alert alert-error text-sm">{error}</div> : null}

        <div className="card bg-base-200 p-4 space-y-3">
          <div className="text-sm opacity-80">find free ports in range</div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="select select-bordered select-sm"
              value={selectedHost}
              onChange={(e) => setSelectedHost(e.target.value)}
            >
              <option value="">select host…</option>
              {hosts.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <input
              type="number"
              className="input input-bordered input-sm w-24"
              value={rangeLo}
              onChange={(e) => setRangeLo(Number(e.target.value))}
              min={1}
              max={65535}
            />
            <span>–</span>
            <input
              type="number"
              className="input input-bordered input-sm w-24"
              value={rangeHi}
              onChange={(e) => setRangeHi(Number(e.target.value))}
              min={1}
              max={65535}
            />
            <button
              className="btn btn-sm btn-primary"
              disabled={!selectedHost || loading || rangeHi < rangeLo}
              onClick={() => load(selectedHost)}
            >
              find
            </button>
          </div>
          {data?.freeInRange ? (
            <div className="text-sm">
              <strong>{data.freeInRange.free.length}</strong> free ports on{' '}
              <code>{data.freeInRange.host}</code> in {data.freeInRange.lo}–
              {data.freeInRange.hi}.{' '}
              {data.freeInRange.free.length > 0 ? (
                <>
                  first:{' '}
                  <code>{data.freeInRange.free.slice(0, 20).join(', ')}</code>
                  {data.freeInRange.free.length > 20 ? '…' : ''}
                </>
              ) : null}
            </div>
          ) : null}
        </div>

        {hosts.map((h) => (
          <HostPortTable key={h} host={h} ports={data!.byHost[h]} />
        ))}
      </div>
    </>
  );
}

function HostPortTable({ host, ports }: { host: string; ports: PortRow[] }) {
  return (
    <div>
      <h2 className="text-lg mb-2">
        {host} <span className="text-sm opacity-60">({ports.length} bindings)</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>port</th>
              <th>proto</th>
              <th>services</th>
            </tr>
          </thead>
          <tbody>
            {ports.map((p) => (
              <tr key={`${p.port}-${p.protocol}`}>
                <td className="font-mono">{p.port}</td>
                <td>{p.protocol}</td>
                <td>{p.names.join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
