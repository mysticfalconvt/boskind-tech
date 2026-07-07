import { useCallback, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useHomelabAuth } from '@/lib/homelab/client';
import { useSort, SortableTh, type Accessor } from '@/lib/homelab/useSort';

type SnapshotRow = {
  id: string;
  takenAt: string;
  status: string;
  containerCount: number;
  vmCount: number;
  coolifyAppCount: number;
  coolifyServiceCount: number;
  coolifyDbCount: number;
  errors: string | null;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

const SORTERS: Record<string, Accessor<SnapshotRow>> = {
  taken: (s) => new Date(s.takenAt).getTime(),
  status: (s) => s.status,
  containers: (s) => s.containerCount,
  vms: (s) => s.vmCount,
  apps: (s) => s.coolifyAppCount,
  dbs: (s) => s.coolifyDbCount,
  errors: (s) => s.errors,
};

export default function HomelabDashboard() {
  const { ready, authedFetch, logout } = useHomelabAuth();
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [snapshotting, setSnapshotting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authedFetch('/api/homelab/snapshots');
      const data = await res.json();
      setSnapshots(data.snapshots ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [authedFetch]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  async function snapshotNow() {
    setSnapshotting(true);
    setError(null);
    setFlash(null);
    try {
      const res = await authedFetch('/api/homelab/snapshot', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Error ${res.status}`);
        return;
      }
      const c = data.counts ?? {};
      setFlash(
        `snapshot ok — ${c.containers} containers, ${c.vms} vms, ` +
          `${c.coolifyApps} coolify apps, ${c.coolifyDbs} coolify dbs, ` +
          `${c.resources} resources written` +
          (data.error ? ` (partial: ${data.error})` : ''),
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSnapshotting(false);
    }
  }

  const { sorted, sort, toggle } = useSort(snapshots, SORTERS, {
    key: 'taken',
    dir: 'desc',
  });

  if (!ready) return null;
  const latest = snapshots[0];

  return (
    <>
      <Head>
        <title>homelab · boskind.tech</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl">homelab</h1>
          <div className="flex gap-2">
            <Link href="/homelab/services" className="btn btn-sm">services</Link>
            <Link href="/homelab/ports" className="btn btn-sm">ports</Link>
            <Link href="/homelab/stacks" className="btn btn-sm">stacks</Link>
            <button
              className="btn btn-sm btn-primary"
              onClick={snapshotNow}
              disabled={snapshotting}
            >
              {snapshotting ? 'snapshotting…' : 'snapshot now'}
            </button>
            <button className="btn btn-sm btn-ghost" onClick={logout}>lock</button>
          </div>
        </div>

        {flash ? <div className="alert alert-success text-sm">{flash}</div> : null}
        {error ? <div className="alert alert-error text-sm">{error}</div> : null}

        {latest ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Stat label="containers" value={latest.containerCount} />
            <Stat label="vms" value={latest.vmCount} />
            <Stat label="coolify apps" value={latest.coolifyAppCount} />
            <Stat label="coolify services" value={latest.coolifyServiceCount} />
            <Stat label="coolify dbs" value={latest.coolifyDbCount} />
          </div>
        ) : loading ? (
          <div className="text-sm opacity-60">loading…</div>
        ) : (
          <div className="alert">
            No snapshots yet. Click <strong>snapshot now</strong> to take the first.
          </div>
        )}

        <div>
          <h2 className="text-lg mb-2">snapshot history</h2>
          {snapshots.length === 0 ? (
            <div className="text-sm opacity-60">none</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <SortableTh label="taken" sortKey="taken" sort={sort} toggle={toggle} />
                    <SortableTh label="status" sortKey="status" sort={sort} toggle={toggle} />
                    <SortableTh label="containers" sortKey="containers" sort={sort} toggle={toggle} />
                    <SortableTh label="vms" sortKey="vms" sort={sort} toggle={toggle} />
                    <SortableTh label="coolify apps" sortKey="apps" sort={sort} toggle={toggle} />
                    <SortableTh label="coolify dbs" sortKey="dbs" sort={sort} toggle={toggle} />
                    <SortableTh label="errors" sortKey="errors" sort={sort} toggle={toggle} />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr key={s.id}>
                      <td>{formatDate(s.takenAt)}</td>
                      <td>
                        <span
                          className={
                            s.status === 'ok'
                              ? 'badge badge-success'
                              : 'badge badge-warning'
                          }
                        >
                          {s.status}
                        </span>
                      </td>
                      <td>{s.containerCount}</td>
                      <td>{s.vmCount}</td>
                      <td>{s.coolifyAppCount}</td>
                      <td>{s.coolifyDbCount}</td>
                      <td className="text-xs opacity-70 max-w-md truncate">
                        {s.errors ?? ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat bg-base-200 rounded p-3">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-2xl">{value}</div>
    </div>
  );
}
