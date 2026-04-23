import { useCallback, useState } from 'react';

type LatencyState = {
  proxy: string;
  toxicName: string;
  enabled: boolean;
  listen: string;
  upstream: string;
  latencyMs: number | null;
  jitterMs: number | null;
  apiHost: string | null;
};

type ApiErrorBody = { error?: string; hint?: string };

export default function ToxiproxyDelayPage() {
  const [state, setState] = useState<LatencyState | null>(null);
  const [latencyInput, setLatencyInput] = useState('');
  const [jitterInput, setJitterInput] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawSuccess, setRawSuccess] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRawSuccess(null);
    try {
      const res = await fetch('/api/toxiproxy/latency');
      const data = (await res.json()) as LatencyState & ApiErrorBody;
      if (!res.ok) {
        setState(null);
        setError(data.error || res.statusText);
        return;
      }
      setState(data);
      if (data.latencyMs != null) {
        setLatencyInput(String(data.latencyMs));
      }
      if (data.jitterMs != null) {
        setJitterInput(String(data.jitterMs));
      }
    } catch (e) {
      setState(null);
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyLatency = async () => {
    const latency = Number(latencyInput);
    const jitter = Number(jitterInput || '0');
    setLoading(true);
    setError(null);
    setRawSuccess(null);
    try {
      const res = await fetch('/api/toxiproxy/latency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latency, jitter }),
      });
      const data = (await res.json()) as {
        state?: LatencyState;
        toxic?: unknown;
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        setError([data.error, data.hint].filter(Boolean).join(' — ') || res.statusText);
        return;
      }
      if (data.state) setState(data.state);
      setRawSuccess(JSON.stringify(data.toxic ?? data.state, null, 2));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const clearLatency = async () => {
    setLoading(true);
    setError(null);
    setRawSuccess(null);
    try {
      const res = await fetch('/api/toxiproxy/latency', { method: 'DELETE' });
      const data = (await res.json()) as {
        state?: LatencyState;
        error?: string;
        hint?: string;
      };
      if (!res.ok) {
        setError([data.error, data.hint].filter(Boolean).join(' — ') || res.statusText);
        return;
      }
      if (data.state) setState(data.state);
      setRawSuccess('Latency toxic removed.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col p-10 bg-base-100">
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-8 border border-base-300">
        <h1 className="text-2xl font-bold text-base-content mb-2">
          Toxiproxy latency
        </h1>
        <p className="text-sm text-base-content/70 mb-6 max-w-2xl">
          Reads and sets the downstream latency toxic for the proxy configured on
          the server (<code className="text-xs">TOXIPROXY_API</code>,{' '}
          <code className="text-xs">TOXIPROXY_PROXY</code>). Requests go through
          this app so they are not blocked by Toxiproxy&apos;s browser guard.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            className="btn btn-primary"
            disabled={loading}
            onClick={() => void refresh()}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm" />
            ) : null}
            Fetch current delay
          </button>
        </div>

        {error && (
          <div className="p-4 mb-4 text-sm text-error bg-error/10 rounded-lg whitespace-pre-wrap">
            {error}
          </div>
        )}

        {state && (
          <div className="mb-6 space-y-2 text-base-content">
            <p className="text-sm">
              <span className="text-base-content/70">API host: </span>
              {state.apiHost ?? '—'}
            </p>
            <p className="text-sm">
              <span className="text-base-content/70">Proxy: </span>
              {state.proxy}
              <span className="text-base-content/70"> · toxic: </span>
              {state.toxicName}
            </p>
            <p className="text-sm">
              <span className="text-base-content/70">Enabled: </span>
              {state.enabled ? 'yes' : 'no'}
            </p>
            <p className="text-sm">
              <span className="text-base-content/70">Listen / upstream: </span>
              {state.listen} → {state.upstream}
            </p>
            <p className="text-lg font-semibold mt-4">
              Current delay:{' '}
              {state.latencyMs == null ? (
                <span className="text-base-content/70 font-normal">none</span>
              ) : (
                <>{state.latencyMs} ms</>
              )}
              {state.latencyMs != null && state.jitterMs != null && state.jitterMs > 0 ? (
                <span className="text-base font-normal text-base-content/80">
                  {' '}
                  (jitter {state.jitterMs} ms)
                </span>
              ) : null}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 max-w-xl mb-4">
          <label className="form-control w-full">
            <span className="label-text text-base-content/80">Latency (ms)</span>
            <input
              type="number"
              min={0}
              className="input input-bordered w-full bg-base-100"
              value={latencyInput}
              onChange={(e) => setLatencyInput(e.target.value)}
              placeholder="e.g. 10000"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text text-base-content/80">Jitter (ms)</span>
            <input
              type="number"
              min={0}
              className="input input-bordered w-full bg-base-100"
              value={jitterInput}
              onChange={(e) => setJitterInput(e.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            disabled={loading}
            onClick={() => void applyLatency()}
          >
            Apply delay
          </button>
          <button
            type="button"
            className="btn btn-outline"
            disabled={loading}
            onClick={() => void clearLatency()}
          >
            Clear delay
          </button>
        </div>

        {rawSuccess && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-base-content mb-2">
              Last response
            </h2>
            <pre className="bg-base-300 rounded-lg p-4 text-sm overflow-x-auto whitespace-pre-wrap text-base-content">
              {rawSuccess}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
