import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const PASSWORD_STORAGE_KEY = 'policy-llm-password';

type PolicyRole = 'viewer' | 'admin';

type SyncDocDetail = {
  policyCode: string | null;
  title: string;
  sourceUrl: string;
  status: 'indexed' | 'skipped' | 'error';
  ms: number;
  chunks: number;
  embedTokens: number;
  error?: string;
};

type SyncJob = {
  id: string;
  status: 'running' | 'completed' | 'error';
  total: number;
  completed: number;
  skipped: number;
  errors: number;
  chunksCreated: number;
  embedTokens: number;
  message: string | null;
  details: SyncDocDetail[] | null;
  startedAt: string;
  finishedAt: string | null;
};

type SyncStats = {
  runs: number;
  completed: number;
  skipped: number;
  errors: number;
  chunks_created: number;
  embed_tokens: number | string;
  total_seconds: number;
};

type DocRow = {
  id: string;
  policyCode: string | null;
  title: string;
  sourceUrl: string;
  lastSyncedAt: string | null;
  updateCount: number;
  contentUpdatedAt: string | null;
  chunkCount: number;
  sectionCount: number;
  embedTokens: number;
};

type TopicGroup = {
  topicCode: string;
  topicName: string;
  documents: DocRow[];
};

type Citation = {
  policyCode: string | null;
  title: string;
  sourceUrl: string;
  sections?: string[];
};

function formatSeconds(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function syncDuration(job: SyncJob): string {
  const start = new Date(job.startedAt).getTime();
  const end = job.finishedAt ? new Date(job.finishedAt).getTime() : Date.now();
  return formatSeconds((end - start) / 1000);
}

export default function PolicyPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  // Role is decided by which password was entered. 'admin' sees sync controls.
  const [role, setRole] = useState<PolicyRole | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  const [job, setJob] = useState<SyncJob | null>(null);
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [topics, setTopics] = useState<TopicGroup[]>([]);
  const [docCount, setDocCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const authedFetch = useCallback(
    async (url: string, init?: RequestInit, pw?: string) => {
      const res = await fetch(url, {
        ...init,
        headers: {
          ...(init?.headers ?? {}),
          'x-policy-password': pw ?? password,
          ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
      if (res.status === 401 || res.status === 503) {
        setAuthed(false);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
        }
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unauthorized');
      }
      return res;
    },
    [password],
  );

  const loadDocuments = useCallback(
    async (pw?: string) => {
      const res = await authedFetch('/api/policy/documents', undefined, pw);
      const data = await res.json();
      setTopics(data.topics ?? []);
      setDocCount(data.count ?? 0);
    },
    [authedFetch],
  );

  const loadJob = useCallback(
    async (pw?: string) => {
      const res = await authedFetch('/api/policy/sync', undefined, pw);
      const data = await res.json();
      setJob(data.job ?? null);
      setStats(data.stats ?? null);
      return data.job as SyncJob | null;
    },
    [authedFetch],
  );

  // Verify a password and return its role ('viewer' | 'admin'), or null if bad.
  const verifyAccess = useCallback(
    async (pw: string): Promise<PolicyRole | null> => {
      const res = await authedFetch(
        '/api/policy/auth',
        { method: 'POST', body: JSON.stringify({}) },
        pw,
      );
      if (!res.ok) return null;
      const data = await res.json();
      return (data.role as PolicyRole) ?? 'viewer';
    },
    [authedFetch],
  );

  // Restore password from sessionStorage and attempt to unlock on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(PASSWORD_STORAGE_KEY);
    if (!stored) return;
    setPassword(stored);
    (async () => {
      try {
        const r = await verifyAccess(stored);
        if (!r) {
          window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
          setAuthed(false);
          return;
        }
        setRole(r);
        await loadDocuments(stored);
        await loadJob(stored);
        setAuthed(true);
      } catch {
        setAuthed(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setUnlocking(true);
    try {
      const r = await verifyAccess(password);
      if (!r) {
        setError('Invalid password');
        setAuthed(false);
        return;
      }
      setRole(r);
      await loadDocuments(password);
      await loadJob(password);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PASSWORD_STORAGE_KEY, password);
      }
      setAuthed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock');
      setAuthed(false);
    } finally {
      setUnlocking(false);
    }
  };

  const logout = () => {
    stopPolling();
    setAuthed(false);
    setRole(null);
    setPassword('');
    setAnswer(null);
    setCitations([]);
    setStats(null);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
    }
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const current = await loadJob();
        if (!current || current.status !== 'running') {
          stopPolling();
          setSyncing(false);
          await loadDocuments();
        }
      } catch {
        stopPolling();
        setSyncing(false);
      }
    }, 1500);
  }, [loadJob, loadDocuments]);

  useEffect(() => stopPolling, []);

  const startSync = async (wipe = false) => {
    if (!isAdmin) {
      setError('Admin access required to run a sync.');
      return;
    }
    if (wipe && typeof window !== 'undefined') {
      const ok = window.confirm(
        'Wipe all indexed policy data and re-sync from scratch? This deletes every stored document, section, and chunk.',
      );
      if (!ok) return;
    }

    setError(null);
    setSyncing(true);
    try {
      const res = await authedFetch('/api/policy/sync', {
        method: 'POST',
        body: JSON.stringify({ wipe }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSyncing(false);
        setError(data.error || 'Failed to start sync');
        return;
      }
      setJob(data.job ?? null);
      startPolling();
    } catch (err) {
      setSyncing(false);
      setError(err instanceof Error ? err.message : 'Failed to start sync');
    }
  };

  const ask = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!question.trim()) return;
    setError(null);
    setAsking(true);
    setAnswer(null);
    setCitations([]);
    try {
      const sres = await authedFetch('/api/policy/search', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      const data = await sres.json();
      if (!sres.ok) {
        setError(data.error || 'Search failed');
        return;
      }
      setAnswer(data.answer ?? '');
      setCitations(data.citations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setAsking(false);
    }
  };

  if (!authed) {
    return (
      <div className="flex flex-col items-center p-10 bg-base-100 min-h-screen">
        <form
          onSubmit={unlock}
          className="w-full max-w-md bg-base-200 rounded-xl shadow-xl p-8 border border-base-300 mt-10"
        >
          <h1 className="text-2xl font-bold text-base-content mb-2">
            NCSU Policy
          </h1>
          <p className="text-sm text-base-content/70 mb-6">
            This page is password protected. Enter the access password to
            continue.
          </p>
          <label className="form-control w-full mb-4">
            <span className="label-text text-base-content/80">Password</span>
            <input
              type="password"
              className="input input-bordered w-full bg-base-100"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Access password"
              autoComplete="off"
            />
          </label>
          {error && (
            <div className="p-3 mb-4 text-sm text-error bg-error/10 rounded-lg">
              {error}
            </div>
          )}
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={unlocking || !password}
          >
            {unlocking && <span className="loading loading-spinner loading-sm" />}
            Unlock
          </button>
        </form>
      </div>
    );
  }

  const lastSync = job?.finishedAt
    ? new Date(job.finishedAt).toLocaleString()
    : job?.status === 'running'
      ? 'in progress…'
      : 'never';

  // Flatten all documents and map last-run timing by source URL.
  const allDocs = topics.flatMap((t) =>
    t.documents.map((d) => ({ ...d, topicCode: t.topicCode })),
  );
  const lastRunByUrl = new Map(
    (job?.details ?? []).map((d) => [d.sourceUrl, d]),
  );
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleString() : '—';

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10 bg-base-100 min-h-screen">
      {/* Header */}
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-6 md:p-8 border border-base-300">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-base-content mb-1">
              NCSU Policy Search
            </h1>
            <p className="text-sm text-base-content/70 max-w-2xl">
              Ask questions and get answers grounded in the North Country
              Supervisory Union policy library.
            </p>
            <a
              href="https://www.ncsuvt.org/27829_1"
              target="_blank"
              rel="noreferrer"
              className="link link-primary text-sm mt-1 inline-block"
            >
              View the original NCSU policy page →
            </a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="badge badge-outline">
              {isAdmin ? 'Admin' : 'Viewer'}
            </span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={logout}>
              Log out
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-error bg-error/10 rounded-lg whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Ask panel */}
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-6 md:p-8 border border-base-300">
        <h2 className="text-xl font-semibold text-base-content mb-3">
          Ask a question
        </h2>
        <form onSubmit={ask} className="flex flex-col gap-3">
          <textarea
            className="textarea textarea-bordered w-full bg-base-100 min-h-24"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter inserts a newline.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!asking && question.trim() && docCount > 0) {
                  void ask();
                }
              }
            }}
            placeholder="Ask a question…  (Enter to send, Shift+Enter for a new line)"
          />
          <div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={asking || !question.trim() || docCount === 0}
            >
              {asking && <span className="loading loading-spinner loading-sm" />}
              Ask
            </button>
            {docCount === 0 && (
              <span className="ml-3 text-sm text-base-content/60">
                Sync some documents first.
              </span>
            )}
          </div>
        </form>

        {answer && (
          <div className="mt-6">
            <div className="prose max-w-none bg-base-100 rounded-lg p-4 border border-base-300 text-base-content">
              <ReactMarkdown>{answer}</ReactMarkdown>
            </div>
            {citations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-base-content/80 mb-2">
                  Sources
                </h3>
                <ul className="flex flex-col gap-2">
                  {citations.map((c) => (
                    <li key={c.sourceUrl}>
                      <a
                        href={c.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="link link-primary text-sm"
                      >
                        {c.policyCode ? `${c.policyCode} — ` : ''}
                        {c.title}
                      </a>
                      {c.sections && c.sections.length > 0 && (
                        <ul className="ml-4 mt-0.5 list-disc list-inside">
                          {c.sections.map((s, i) => (
                            <li
                              key={`${c.sourceUrl}-sec-${i}`}
                              className="text-xs text-base-content/60"
                            >
                              {s}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sync panel */}
      <div className="w-full bg-base-200 rounded-xl shadow-xl p-6 md:p-8 border border-base-300">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-xl font-semibold text-base-content">
            Document library
          </h2>
          {/* Sync controls are admin-only. */}
          {isAdmin && (
            <div className="flex gap-2">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={syncing || job?.status === 'running'}
                onClick={() => void startSync(false)}
              >
                {(syncing || job?.status === 'running') && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Sync
              </button>
              {/* Dev-only: clears all indexed data then re-syncs. Remove before prod. */}
              <button
                type="button"
                className="btn btn-outline btn-error"
                disabled={syncing || job?.status === 'running'}
                onClick={() => void startSync(true)}
                title="Delete all indexed policy data, then re-sync"
              >
                Wipe &amp; Sync
              </button>
            </div>
          )}
        </div>

        <div className="text-sm text-base-content/70 mb-4">
          <span className="mr-4">Documents: {docCount}</span>
          <span className="mr-4">Last sync: {lastSync}</span>
          {job?.message && (
            <span className="block mt-1 text-base-content/60">
              {job.message}
            </span>
          )}
        </div>

        {job?.status === 'running' && job.total > 0 && (
          <progress
            className="progress progress-secondary w-full mb-4"
            value={job.completed}
            max={job.total}
          />
        )}

        {/* Last-run metrics */}
        {job && (
          <>
          <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
            Last sync
          </div>
          <div className="stats stats-vertical sm:stats-horizontal bg-base-100 border border-base-300 mb-4 w-full">
            <div className="stat py-2 px-4">
              <div className="stat-title text-xs">Duration</div>
              <div className="stat-value text-lg">{syncDuration(job)}</div>
            </div>
            <div className="stat py-2 px-4">
              <div className="stat-title text-xs">Processed / unchanged</div>
              <div className="stat-value text-lg">
                {job.completed - job.skipped} / {job.skipped}
              </div>
            </div>
            <div className="stat py-2 px-4">
              <div className="stat-title text-xs">Chunks created</div>
              <div className="stat-value text-lg">{job.chunksCreated}</div>
            </div>
            <div className="stat py-2 px-4">
              <div className="stat-title text-xs">Embed tokens (approx)</div>
              <div className="stat-value text-lg">
                {job.embedTokens.toLocaleString()}
              </div>
            </div>
            {job.errors > 0 && (
              <div className="stat py-2 px-4">
                <div className="stat-title text-xs">Errors</div>
                <div className="stat-value text-lg text-error">
                  {job.errors}
                </div>
              </div>
            )}
          </div>

          {/* All-time totals across every sync run */}
          {stats && stats.runs > 0 && (
            <>
              <div className="text-xs font-semibold text-base-content/60 uppercase tracking-wide mb-1">
                All-time ({stats.runs} {stats.runs === 1 ? 'run' : 'runs'})
              </div>
              <div className="stats stats-vertical sm:stats-horizontal bg-base-100 border border-base-300 mb-4 w-full">
                <div className="stat py-2 px-4">
                  <div className="stat-title text-xs">Total time</div>
                  <div className="stat-value text-lg">
                    {formatSeconds(stats.total_seconds)}
                  </div>
                </div>
                <div className="stat py-2 px-4">
                  <div className="stat-title text-xs">Docs processed</div>
                  <div className="stat-value text-lg">{stats.completed}</div>
                </div>
                <div className="stat py-2 px-4">
                  <div className="stat-title text-xs">Chunks created</div>
                  <div className="stat-value text-lg">
                    {stats.chunks_created.toLocaleString()}
                  </div>
                </div>
                <div className="stat py-2 px-4">
                  <div className="stat-title text-xs">Embed tokens (approx)</div>
                  <div className="stat-value text-lg">
                    {Number(stats.embed_tokens).toLocaleString()}
                  </div>
                </div>
                {stats.errors > 0 && (
                  <div className="stat py-2 px-4">
                    <div className="stat-title text-xs">Errors</div>
                    <div className="stat-value text-lg text-error">
                      {stats.errors}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          </>
        )}

        {/* Per-document breakdown — all stored documents */}
        {allDocs.length > 0 && (
          <details className="mb-4">
            <summary className="cursor-pointer text-sm text-base-content/70">
              Per-document breakdown ({allDocs.length})
            </summary>
            <div className="overflow-x-auto mt-2">
              <table className="table table-xs">
                <thead>
                  <tr>
                    <th>Policy</th>
                    <th className="text-right">Sections</th>
                    <th className="text-right">Chunks</th>
                    <th className="text-right">Tokens</th>
                    <th className="text-right">Updates</th>
                    <th>Last updated</th>
                    <th>Last synced</th>
                    <th className="text-right">Last run</th>
                  </tr>
                </thead>
                <tbody>
                  {allDocs.map((d) => {
                    const run = lastRunByUrl.get(d.sourceUrl);
                    return (
                      <tr key={d.id}>
                        <td className="max-w-xs truncate" title={d.title}>
                          <a
                            href={d.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="link link-hover text-base-content/80"
                          >
                            {d.policyCode ? `${d.policyCode} ` : ''}
                            {d.title}
                          </a>
                          {run?.error && (
                            <span
                              className="block text-xs text-error/70 truncate"
                              title={run.error}
                            >
                              {run.error}
                            </span>
                          )}
                        </td>
                        <td className="text-right">{d.sectionCount}</td>
                        <td className="text-right">{d.chunkCount}</td>
                        <td className="text-right">
                          {d.embedTokens.toLocaleString()}
                        </td>
                        <td className="text-right">{d.updateCount}</td>
                        <td>{fmtDate(d.contentUpdatedAt)}</td>
                        <td>{fmtDate(d.lastSyncedAt)}</td>
                        <td className="text-right">
                          {run ? `${(run.ms / 1000).toFixed(1)}s` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        )}

        <div className="flex flex-col gap-4">
          {topics.map((t) => (
            <div
              key={t.topicCode}
              className="bg-base-100 rounded-lg p-4 border border-base-300"
            >
              <h3 className="font-semibold text-base-content mb-2">
                {t.topicCode}. {t.topicName}
                <span className="ml-2 text-xs text-base-content/50">
                  ({t.documents.length})
                </span>
              </h3>
              <ul className="flex flex-col gap-1">
                {t.documents.map((d) => (
                  <li key={d.id} className="text-sm">
                    <a
                      href={d.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="link link-hover text-base-content/80"
                    >
                      {d.policyCode ? `${d.policyCode} — ` : ''}
                      {d.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {topics.length === 0 && (
            <div className="text-sm text-base-content/60">
              No documents yet. Press <strong>Sync</strong> to fetch and index
              the policy library.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
