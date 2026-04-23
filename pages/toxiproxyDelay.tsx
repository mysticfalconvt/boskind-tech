import { useCallback, useEffect, useState } from 'react';

type ProxyState = {
  proxy: string;
  toxicName: string;
  enabled: boolean;
  listen: string;
  upstream: string;
  latencyMs: number | null;
  jitterMs: number | null;
  bandwidthKbps: number | null;
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

type ProxyInputs = { latency: string; jitter: string; bandwidth: string };

const PASSWORD_STORAGE_KEY = 'toxiproxy-password';

function joinErr(err?: string, hint?: string, fallback = 'Request failed'): string {
  return [err, hint].filter(Boolean).join(' — ') || fallback;
}

function inputsFromState(p: ProxyState, prev?: ProxyInputs): ProxyInputs {
  return {
    latency: p.latencyMs != null ? String(p.latencyMs) : prev?.latency ?? '',
    jitter: p.jitterMs != null ? String(p.jitterMs) : prev?.jitter ?? '0',
    bandwidth:
      p.bandwidthKbps != null ? String(p.bandwidthKbps) : prev?.bandwidth ?? '',
  };
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
      [next.proxy]: inputsFromState(next, prev[next.proxy]),
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
          next[p.proxy] = inputsFromState(p, prev[p.proxy]);
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

  const requirePassword = (): boolean => {
    if (!password) {
      setError('Enter the admin password before making changes.');
      return false;
    }
    return true;
  };

  const runMutation = async (
    proxy: string,
    url: string,
    init: RequestInit,
    successMessage: string,
  ) => {
    setBusyProxy(proxy);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(url, init);
      const data = (await res.json()) as MutationResponse;
      if (!res.ok) {
        setError(joinErr(data.error, data.hint, res.statusText));
        return;
      }
      if (data.state) mergeState(data.state);
      setSuccess(successMessage);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setBusyProxy(null);
    }
  };

  const applyLatency = async (proxy: string) => {
    if (!requirePassword()) return;
    const form = inputs[proxy];
    const latency = Number(form?.latency);
    const jitter = Number(form?.jitter || '0');
    await runMutation(
      proxy,
      '/api/toxiproxy/latency',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toxiproxy-password': password,
        },
        body: JSON.stringify({ proxy, latency, jitter }),
      },
      `Applied ${latency} ms${jitter ? ` (±${jitter} ms jitter)` : ''} to ${proxy}.`,
    );
  };

  const clearLatency = async (proxy: string) => {
    if (!requirePassword()) return;
    await runMutation(
      proxy,
      `/api/toxiproxy/latency?proxy=${encodeURIComponent(proxy)}`,
      {
        method: 'DELETE',
        headers: { 'x-toxiproxy-password': password },
      },
      `Cleared delay on ${proxy}.`,
    );
  };

  const applyBandwidth = async (proxy: string) => {
    if (!requirePassword()) return;
    const rate = Number(inputs[proxy]?.bandwidth);
    await runMutation(
      proxy,
      '/api/toxiproxy/bandwidth',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toxiproxy-password': password,
        },
        body: JSON.stringify({ proxy, rate }),
      },
      `Limited ${proxy} to ${rate} KB/s.`,
    );
  };

  const clearBandwidth = async (proxy: string) => {
    if (!requirePassword()) return;
    await runMutation(
      proxy,
      `/api/toxiproxy/bandwidth?proxy=${encodeURIComponent(proxy)}`,
      {
        method: 'DELETE',
        headers: { 'x-toxiproxy-password': password },
      },
      `Removed bandwidth limit on ${proxy}.`,
    );
  };

  const setEnabled = async (proxy: string, enabled: boolean) => {
    if (!requirePassword()) return;
    await runMutation(
      proxy,
      '/api/toxiproxy/enabled',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-toxiproxy-password': password,
        },
        body: JSON.stringify({ proxy, enabled }),
      },
      `${proxy} is now ${enabled ? 'up' : 'down'}.`,
    );
  };

  return (
    <div className="flex flex-col p-10 bg-base-100">
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-8 border border-base-300">
        <h1 className="text-2xl font-bold text-base-content mb-2">
          Toxiproxy controls
        </h1>
        <p className="text-sm text-base-content/70 mb-6 max-w-2xl">
          View and adjust latency, bandwidth, and availability on each
          configured proxy. Changes require the admin password.
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
            const form = inputs[p.proxy] ?? { latency: '', jitter: '0', bandwidth: '' };
            const isBusy = busyProxy === p.proxy;
            return (
              <div
                key={p.proxy}
                className="bg-base-100 rounded-xl p-6 border border-base-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <h2 className="text-xl font-semibold text-base-content">
                    {p.proxy}
                  </h2>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-sm text-base-content/70">
                      {p.enabled ? 'Up' : 'Down'}
                    </span>
                    <input
                      type="checkbox"
                      className="toggle toggle-success"
                      checked={p.enabled}
                      disabled={isBusy}
                      onChange={(e) => void setEnabled(p.proxy, e.target.checked)}
                    />
                  </label>
                </div>
                <p className="text-sm text-base-content/70 mb-4">
                  {p.listen} → {p.upstream}
                </p>

                <div className="grid gap-2 mb-4 text-base-content">
                  <p className="text-base">
                    <span className="text-base-content/60">Delay: </span>
                    {p.latencyMs == null ? (
                      <span className="text-base-content/70">none</span>
                    ) : (
                      <span className="font-semibold">
                        {p.latencyMs} ms
                        {p.jitterMs != null && p.jitterMs > 0
                          ? ` (jitter ${p.jitterMs} ms)`
                          : ''}
                      </span>
                    )}
                  </p>
                  <p className="text-base">
                    <span className="text-base-content/60">Bandwidth: </span>
                    {p.bandwidthKbps == null ? (
                      <span className="text-base-content/70">unlimited</span>
                    ) : (
                      <span className="font-semibold">{p.bandwidthKbps} KB/s</span>
                    )}
                  </p>
                </div>

                <div className="border-t border-base-300 pt-4 mb-4">
                  <h3 className="text-sm font-semibold text-base-content/80 mb-2">
                    Latency
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 max-w-xl mb-3">
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
                      className="btn btn-secondary btn-sm"
                      disabled={isBusy}
                      onClick={() => void applyLatency(p.proxy)}
                    >
                      Apply delay
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={isBusy}
                      onClick={() => void clearLatency(p.proxy)}
                    >
                      Clear delay
                    </button>
                  </div>
                </div>

                <div className="border-t border-base-300 pt-4">
                  <h3 className="text-sm font-semibold text-base-content/80 mb-2">
                    Bandwidth
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 max-w-xl mb-3">
                    <label className="form-control w-full">
                      <span className="label-text text-base-content/80">Rate (KB/s)</span>
                      <input
                        type="number"
                        min={0}
                        className="input input-bordered w-full bg-base-100"
                        value={form.bandwidth}
                        onChange={(e) =>
                          setInputs((prev) => ({
                            ...prev,
                            [p.proxy]: { ...form, bandwidth: e.target.value },
                          }))
                        }
                        placeholder="e.g. 256"
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      disabled={isBusy}
                      onClick={() => void applyBandwidth(p.proxy)}
                    >
                      Apply limit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      disabled={isBusy}
                      onClick={() => void clearBandwidth(p.proxy)}
                    >
                      Clear limit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
