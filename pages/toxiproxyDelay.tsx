import { useCallback, useEffect, useState } from 'react';

type ProxyState = {
  proxy: string;
  toxicName: string;
  enabled: boolean;
  listen: string;
  upstream: string;
  latencyMs: number | null;
  jitterMs: number | null;
};

type ListResponse = {
  proxies: ProxyState[];
  toxicName: string;
  apiHost: string | null;
  error?: string;
  hint?: string;
};

type MutationResponse = {
  state?: ProxyState;
  toxic?: unknown;
  cleared?: boolean;
  error?: string;
  hint?: string;
};

type ProxyInputs = { latency: string; jitter: string };

const PASSWORD_STORAGE_KEY = 'toxiproxy-password';

function joinErr(err?: string, hint?: string, fallback = 'Request failed'): string {
  return [err, hint].filter(Boolean).join(' — ') || fallback;
}

export default function ToxiproxyDelayPage() {
  const [proxies, setProxies] = useState<ProxyState[] | null>(null);
  const [inputs, setInputs] = useState<Record<string, ProxyInputs>>({});
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyProxy, setBusyProxy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(PASSWORD_STORAGE_KEY);
    if (stored) setPassword(stored);
  }, []);

  const onPasswordChange = (value: string) => {
    setPassword(value);
    if (typeof window !== 'undefined') {
      if (value) {
        window.sessionStorage.setItem(PASSWORD_STORAGE_KEY, value);
      } else {
        window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
      }
    }
  };

  const mergeState = useCallback((next: ProxyState) => {
    setProxies((prev) => {
      if (!prev) return [next];
      const idx = prev.findIndex((p) => p.proxy === next.proxy);
      if (idx === -1) return [...prev, next].sort((a, b) => a.proxy.localeCompare(b.proxy));
      const copy = prev.slice();
      copy[idx] = next;
      return copy;
    });
    setInputs((prev) => ({
      ...prev,
      [next.proxy]: {
        latency: next.latencyMs != null ? String(next.latencyMs) : prev[next.proxy]?.latency ?? '',
        jitter: next.jitterMs != null ? String(next.jitterMs) : prev[next.proxy]?.jitter ?? '0',
      },
    }));
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/toxiproxy/latency');
      const data = (await res.json()) as ListResponse;
      if (!res.ok) {
        setError(joinErr(data.error, data.hint, res.statusText));
        return;
      }
      setProxies(data.proxies);
      setInputs((prev) => {
        const next: Record<string, ProxyInputs> = { ...prev };
        for (const p of data.proxies) {
          next[p.proxy] = {
            latency: p.latencyMs != null ? String(p.latencyMs) : prev[p.proxy]?.latency ?? '',
            jitter: p.jitterMs != null ? String(p.jitterMs) : prev[p.proxy]?.jitter ?? '0',
          };
        }
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const applyLatency = async (proxy: string) => {
    if (!password) {
      setError('Enter the admin password before changing a delay.');
      return;
    }
    const form = inputs[proxy] ?? { latency: '', jitter: '0' };
    const latency = Number(form.latency);
    const jitter = Number(form.jitter || '0');
    setBusyProxy(proxy);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch('/api/toxiproxy/latency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toxiproxy-password': password,
        },
        body: JSON.stringify({ proxy, latency, jitter }),
      });
      const data = (await res.json()) as MutationResponse;
      if (!res.ok) {
        setError(joinErr(data.error, data.hint, res.statusText));
        return;
      }
      if (data.state) mergeState(data.state);
      setSuccess(
        `Applied ${latency} ms${jitter ? ` (±${jitter} ms jitter)` : ''} to ${proxy}.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusyProxy(null);
    }
  };

  const clearLatency = async (proxy: string) => {
    if (!password) {
      setError('Enter the admin password before changing a delay.');
      return;
    }
    setBusyProxy(proxy);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(
        `/api/toxiproxy/latency?proxy=${encodeURIComponent(proxy)}`,
        {
          method: 'DELETE',
          headers: { 'x-toxiproxy-password': password },
        },
      );
      const data = (await res.json()) as MutationResponse;
      if (!res.ok) {
        setError(joinErr(data.error, data.hint, res.statusText));
        return;
      }
      if (data.state) mergeState(data.state);
      setSuccess(`Cleared delay on ${proxy}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusyProxy(null);
    }
  };

  return (
    <div className="flex flex-col p-10 bg-base-100">
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-8 border border-base-300">
        <h1 className="text-2xl font-bold text-base-content mb-2">
          Toxiproxy latency
        </h1>
        <p className="text-sm text-base-content/70 mb-6 max-w-2xl">
          View and adjust the downstream latency on each configured proxy.
          Changes require the admin password.
        </p>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] items-end mb-6 max-w-2xl">
          <label className="form-control w-full">
            <span className="label-text text-base-content/80">Admin password</span>
            <input
              type="password"
              className="input input-bordered w-full bg-base-100"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Admin password"
              autoComplete="off"
            />
          </label>
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => void refresh()}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : null}
            Refresh
          </button>
        </div>

        {error && (
          <div className="p-4 mb-4 text-sm text-error bg-error/10 rounded-lg whitespace-pre-wrap">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 mb-4 text-sm text-success bg-success/10 rounded-lg whitespace-pre-wrap">
            {success}
          </div>
        )}

        {proxies && proxies.length === 0 && (
          <div className="p-4 mb-4 text-sm text-base-content/70 bg-base-300 rounded-lg">
            Toxiproxy has no proxies configured.
          </div>
        )}

        <div className="flex flex-col gap-4">
          {proxies?.map((p) => {
            const form = inputs[p.proxy] ?? { latency: '', jitter: '0' };
            const isBusy = busyProxy === p.proxy;
            return (
              <div
                key={p.proxy}
                className="bg-base-100 rounded-xl p-6 border border-base-300"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                  <h2 className="text-xl font-semibold text-base-content">
                    {p.proxy}
                  </h2>
                  <span className="text-sm text-base-content/70">
                    toxic: {p.toxicName} · {p.enabled ? 'enabled' : 'disabled'}
                  </span>
                </div>
                <p className="text-sm text-base-content/70 mb-2">
                  {p.listen} → {p.upstream}
                </p>
                <p className="text-lg font-semibold mb-4">
                  Current delay:{' '}
                  {p.latencyMs == null ? (
                    <span className="text-base-content/70 font-normal">none</span>
                  ) : (
                    <>{p.latencyMs} ms</>
                  )}
                  {p.latencyMs != null && p.jitterMs != null && p.jitterMs > 0 ? (
                    <span className="text-base font-normal text-base-content/80">
                      {' '}
                      (jitter {p.jitterMs} ms)
                    </span>
                  ) : null}
                </p>

                <div className="grid gap-4 sm:grid-cols-2 max-w-xl mb-4">
                  <label className="form-control w-full">
                    <span className="label-text text-base-content/80">Latency (ms)</span>
                    <input
                      type="number"
                      min={0}
                      className="input input-bordered w-full bg-base-100"
                      value={form.latency}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [p.proxy]: { ...form, latency: e.target.value },
                        }))
                      }
                      placeholder="e.g. 10000"
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text text-base-content/80">Jitter (ms)</span>
                    <input
                      type="number"
                      min={0}
                      className="input input-bordered w-full bg-base-100"
                      value={form.jitter}
                      onChange={(e) =>
                        setInputs((prev) => ({
                          ...prev,
                          [p.proxy]: { ...form, jitter: e.target.value },
                        }))
                      }
                      placeholder="0"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={isBusy}
                    onClick={() => void applyLatency(p.proxy)}
                  >
                    {isBusy ? (
                      <span className="loading loading-spinner loading-sm" />
                    ) : null}
                    Apply delay
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={isBusy}
                    onClick={() => void clearLatency(p.proxy)}
                  >
                    Clear delay
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
