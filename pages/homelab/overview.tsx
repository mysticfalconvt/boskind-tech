import { useCallback, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useHomelabAuth } from '@/lib/homelab/client';
import { useSort, SortableTh, type Accessor } from '@/lib/homelab/useSort';

const REFRESH_MS = 20_000;

// ---- formatting helpers ---------------------------------------------------
function tb(kbStr: string | number | null | undefined): string {
  const kb = Number(kbStr);
  if (!kb || Number.isNaN(kb)) return '–';
  const t = kb / 1e9;
  return t >= 1 ? `${t.toFixed(2)} TB` : `${(kb / 1e6).toFixed(0)} GB`;
}
function gb(bytes: number | null | undefined): string {
  const b = Number(bytes);
  if (!b || Number.isNaN(b)) return '–';
  return b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : `${(b / 1e6).toFixed(0)} MB`;
}
function pct(n: number | null | undefined): string {
  return n == null || Number.isNaN(n) ? '–' : `${n.toFixed(0)}%`;
}
function barClass(p: number | null): string {
  if (p == null) return 'progress-success';
  return p > 90 ? 'progress-error' : p > 75 ? 'progress-warning' : 'progress-success';
}

type SystemData = {
  array?: {
    state?: string;
    capacity?: { kilobytes?: { free?: string; total?: string; used?: string } };
    parities?: { name: string; size: number; status: string }[];
    disks?: {
      name: string;
      size: number;
      status: string;
      fsType?: string;
      fsFree?: number;
      fsSize?: number;
      temp?: number | null;
    }[];
    caches?: { name: string; size: number; fsType?: string; fsFree?: number; fsSize?: number }[];
  };
};

type GlancesContainer = {
  host: string;
  name: string;
  cpu: number | null;
  mem: number | null;
  status: string | null;
};
type GlancesHost = {
  host: string;
  name: string;
  hostname: string | null;
  cpuPercent: number | null;
  mem: { percent: number | null; used: number | null; total: number | null };
  load: { min1: number | null; cores: number | null };
  temps: { label: string; value: number }[];
  uptime: string | null;
  containers: GlancesContainer[];
  error?: string;
};

type Monitor = {
  name: string;
  type: string | null;
  url: string | null;
  status: number;
  responseTime: number | null;
};

const CONTAINER_SORTERS: Record<string, Accessor<GlancesContainer>> = {
  name: (c) => c.name,
  host: (c) => c.host,
  cpu: (c) => c.cpu ?? -1,
  mem: (c) => c.mem ?? -1,
};

export default function OverviewPage() {
  const { ready, authedFetch } = useHomelabAuth();
  const [system, setSystem] = useState<SystemData | null>(null);
  const [sysErr, setSysErr] = useState<string | null>(null);
  const [hosts, setHosts] = useState<GlancesHost[] | null>(null);
  const [glErr, setGlErr] = useState<string | null>(null);
  const [monitors, setMonitors] = useState<Monitor[] | null>(null);
  const [upErr, setUpErr] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [sysRes, glRes, upRes] = await Promise.allSettled([
      authedFetch('/api/homelab/live/system').then((r) => r.json()),
      authedFetch('/api/homelab/live/glances').then((r) => r.json()),
      authedFetch('/api/homelab/live/uptime').then((r) => r.json()),
    ]);
    const take = (
      r: PromiseSettledResult<any>,
      key: string,
      ok: (v: any) => void,
      err: (m: string) => void,
    ) => {
      if (r.status === 'fulfilled' && r.value?.[key]) ok(r.value[key]);
      else err(r.status === 'fulfilled' ? r.value?.error || 'unavailable' : 'request failed');
    };
    take(sysRes, 'system', (v) => { setSystem(v); setSysErr(null); }, setSysErr);
    take(glRes, 'hosts', (v) => { setHosts(v); setGlErr(null); }, setGlErr);
    take(upRes, 'monitors', (v) => { setMonitors(v); setUpErr(null); }, setUpErr);
    setUpdatedAt(new Date());
    setLoading(false);
  }, [authedFetch]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    const tick = async () => {
      if (!cancelled) await load();
      if (!cancelled) timer.current = setTimeout(tick, REFRESH_MS);
    };
    void tick();
    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ready, load]);

  const allContainers = (hosts ?? []).flatMap((h) => h.containers);
  const { sorted: sortedContainers, sort, toggle } = useSort(
    allContainers,
    CONTAINER_SORTERS,
    { key: 'cpu', dir: 'desc' },
  );

  if (!ready) return null;

  const cap = system?.array?.capacity?.kilobytes;
  const usedPct =
    cap && Number(cap.total) ? Math.round((Number(cap.used) / Number(cap.total)) * 100) : null;

  const upCount = monitors?.filter((m) => m.status === 1).length ?? 0;
  const downCount = monitors?.filter((m) => m.status === 0).length ?? 0;

  return (
    <>
      <Head>
        <title>homelab overview · boskind.tech</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 space-y-6 font-mono">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl">overview</h1>
          <div className="flex gap-2 items-center">
            <span className="text-xs opacity-60">
              {loading ? 'refreshing…' : updatedAt ? `updated ${updatedAt.toLocaleTimeString()}` : ''}
            </span>
            <button className="btn btn-sm" onClick={() => void load()} disabled={loading}>refresh</button>
            <Link href="/homelab" className="btn btn-sm">← dashboard</Link>
            <Link href="/homelab/services" className="btn btn-sm">services</Link>
            <Link href="/homelab/routes" className="btn btn-sm">routes</Link>
          </div>
        </div>
        <div className="text-xs opacity-50">
          live — refreshes every {REFRESH_MS / 1000}s. not stored in snapshots.
        </div>

        {/* ---- Live hosts (Glances) ---- */}
        <section className="space-y-3">
          <h2 className="text-lg">hosts (live)</h2>
          {glErr ? (
            <div className="alert text-sm">
              glances: {glErr}
              {glErr.includes('not configured') ? (
                <span className="opacity-70"> — set HOMELAB_GLANCES_HOSTS.</span>
              ) : null}
            </div>
          ) : !hosts ? (
            <div className="text-sm opacity-60">loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hosts.map((h) => (
                <div key={h.host} className="bg-base-200 rounded p-4 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="font-semibold">{h.name}</span>
                    <span className="text-xs opacity-50">
                      {h.uptime ? `up ${h.uptime}` : h.host}
                    </span>
                  </div>
                  {h.error ? (
                    <div className="text-sm text-error">{h.error}</div>
                  ) : (
                    <>
                      <Meter label={`cpu · ${h.load.cores ?? '?'} cores`} value={h.cpuPercent} text={pct(h.cpuPercent)} />
                      <Meter
                        label="ram"
                        value={h.mem.percent}
                        text={`${gb(h.mem.used)} / ${gb(h.mem.total)} (${pct(h.mem.percent)})`}
                      />
                      <div className="flex justify-between text-xs opacity-70">
                        <span>load {h.load.min1?.toFixed(2) ?? '–'}</span>
                        <span>
                          {h.temps.length
                            ? `${Math.max(...h.temps.map((t) => t.value))}°C max · ${h.containers.length} containers`
                            : `${h.containers.length} containers`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- Unraid storage (GraphQL) ---- */}
        <section className="space-y-3">
          <h2 className="text-lg">storage · unraid array</h2>
          {sysErr ? (
            <div className="alert alert-error text-sm">array: {sysErr}</div>
          ) : !system ? (
            <div className="text-sm opacity-60">loading…</div>
          ) : (
            <>
              {cap ? (
                <div className="bg-base-200 rounded p-3 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>array {system.array?.state ? `· ${system.array.state}` : ''}</span>
                    <span className="opacity-70">
                      {tb(cap.used)} / {tb(cap.total)} used · {tb(cap.free)} free
                    </span>
                  </div>
                  <progress className={`progress w-full ${barClass(usedPct)}`} value={usedPct ?? 0} max={100} />
                </div>
              ) : null}
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>disk</th><th>role</th><th>status</th><th>temp</th><th>fs</th><th>used / size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...(system.array?.parities ?? []).map((d) => ({ ...d, role: 'parity' })),
                      ...(system.array?.disks ?? []).map((d) => ({ ...d, role: 'data' })),
                      ...(system.array?.caches ?? []).map((d) => ({ ...d, role: 'cache' })),
                    ].map((d: any) => (
                      <tr key={`${d.role}-${d.name}`}>
                        <td className="font-mono">{d.name}</td>
                        <td className="opacity-70">{d.role}</td>
                        <td>
                          <span className={`badge badge-sm ${d.status === 'DISK_OK' ? 'badge-success' : d.status ? 'badge-warning' : 'badge-ghost'}`}>
                            {d.status ?? '–'}
                          </span>
                        </td>
                        <td className={d.temp && d.temp >= 45 ? 'text-warning' : ''}>
                          {d.temp != null ? `${d.temp}°C` : '–'}
                        </td>
                        <td className="opacity-70">{d.fsType ?? '–'}</td>
                        <td>{d.fsSize ? `${tb(d.fsSize - (d.fsFree ?? 0))} / ${tb(d.fsSize)}` : tb(d.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        {/* ---- Containers by resource (Glances) ---- */}
        {allContainers.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-lg">
              containers <span className="text-sm opacity-60">({allContainers.length} running)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <SortableTh label="name" sortKey="name" sort={sort} toggle={toggle} />
                    <SortableTh label="host" sortKey="host" sort={sort} toggle={toggle} />
                    <SortableTh label="cpu %" sortKey="cpu" sort={sort} toggle={toggle} />
                    <SortableTh label="mem" sortKey="mem" sort={sort} toggle={toggle} />
                  </tr>
                </thead>
                <tbody>
                  {sortedContainers.map((c) => (
                    <tr key={`${c.host}-${c.name}`}>
                      <td className="whitespace-nowrap">{c.name}</td>
                      <td className="opacity-70">{c.host}</td>
                      <td className={c.cpu && c.cpu >= 50 ? 'text-warning' : ''}>
                        {c.cpu != null ? `${c.cpu.toFixed(1)}%` : '–'}
                      </td>
                      <td>{gb(c.mem)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {/* ---- Uptime Kuma ---- */}
        <section className="space-y-3">
          <h2 className="text-lg">
            uptime kuma{' '}
            {monitors ? (
              <span className="text-sm opacity-60">({upCount} up{downCount ? `, ${downCount} down` : ''})</span>
            ) : null}
          </h2>
          {upErr ? (
            <div className="alert text-sm">
              uptime kuma: {upErr}
              {upErr.includes('not configured') ? (
                <span className="opacity-70"> — add HOMELAB_UPTIMEKUMA_TOKEN (Kuma → Settings → API Keys).</span>
              ) : null}
            </div>
          ) : !monitors ? (
            <div className="text-sm opacity-60">loading…</div>
          ) : monitors.length === 0 ? (
            <div className="text-sm opacity-60">no monitors</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead>
                  <tr><th>monitor</th><th>status</th><th>response</th><th>type</th></tr>
                </thead>
                <tbody>
                  {[...monitors]
                    .sort((a, b) => a.status - b.status || a.name.localeCompare(b.name))
                    .map((m) => (
                      <tr key={m.name}>
                        <td className="whitespace-nowrap font-semibold">{m.name}</td>
                        <td><StatusBadge status={m.status} /></td>
                        <td>{m.responseTime != null ? `${Math.round(m.responseTime)} ms` : '–'}</td>
                        <td className="opacity-70">{m.type ?? '–'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function Meter({ label, value, text }: { label: string; value: number | null; text: string }) {
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs">
        <span className="opacity-70">{label}</span>
        <span>{text}</span>
      </div>
      <progress className={`progress w-full ${barClass(value)}`} value={value ?? 0} max={100} />
    </div>
  );
}

function StatusBadge({ status }: { status: number }) {
  const map: Record<number, { cls: string; txt: string }> = {
    1: { cls: 'badge-success', txt: 'up' },
    0: { cls: 'badge-error', txt: 'down' },
    2: { cls: 'badge-warning', txt: 'pending' },
    3: { cls: 'badge-info', txt: 'maintenance' },
  };
  const s = map[status] ?? { cls: 'badge-ghost', txt: 'unknown' };
  return <span className={`badge badge-sm ${s.cls}`}>{s.txt}</span>;
}
