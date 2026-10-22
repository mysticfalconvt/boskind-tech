import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { BsDownload, BsStarFill, BsUpload } from 'react-icons/bs';
import SessionBlock from '@/components/dragonsteel/SessionBlock';
import SessionModal from '@/components/dragonsteel/SessionModal';
import TimeGrid, { PX_PER_MIN } from '@/components/dragonsteel/TimeGrid';
import {
  buildIcs,
  endMinutes,
  layoutLanes,
  matchesFilters,
  minutesOf,
  overlaps,
  parseIcs,
  schedule,
  Session,
} from '@/lib/dragonsteel/schedule';

const STARRED_KEY = 'dragonsteel-starred';
const MY_SCHEDULE = 'mine';

const startMin = Math.floor(Math.min(...schedule.sessions.map((s) => minutesOf(s.start))) / 60) * 60;
const endMin = Math.ceil(Math.max(...schedule.sessions.map(endMinutes)) / 60) * 60;

function shortDay(label: string) {
  // "Thursday, December 3" -> "Thu Dec 3"
  const [day, rest] = label.split(', ');
  const [month, num] = rest.split(' ');
  return `${day.slice(0, 3)} ${month.slice(0, 3)} ${num}`;
}

export default function DragonsteelPage() {
  const [view, setView] = useState<string>(schedule.dates[0].date);
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    matched: Session[];
    unmatched: number;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STARRED_KEY) ?? '[]');
      if (Array.isArray(saved)) setStarred(new Set(saved));
    } catch {
      // ignore bad saved data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STARRED_KEY, JSON.stringify(Array.from(starred)));
  }, [starred, hydrated]);

  const toggleStar = useCallback((id: number) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCategory = (name: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const starredSessions = useMemo(
    () => schedule.sessions.filter((s) => starred.has(s.id)),
    [starred],
  );

  const conflictsFor = useCallback(
    (s: Session) => starredSessions.filter((o) => o.id !== s.id && overlaps(s, o)),
    [starredSessions],
  );

  const conflictCount = useMemo(
    () => starredSessions.filter((s) => conflictsFor(s).length > 0).length,
    [starredSessions, conflictsFor],
  );

  const isMatch = (s: Session) => matchesFilters(s, search, activeCategories);
  const filtering = search.trim() !== '' || activeCategories.size > 0;

  const exportIcs = () => {
    const blob = new Blob([buildIcs(starredSessions)], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dragonsteel-nexus.ics';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    const { matched, unmatched } = parseIcs(await file.text());
    setPendingImport({ fileName: file.name, matched, unmatched });
  };

  const applyImport = (mode: 'merge' | 'replace') => {
    if (!pendingImport) return;
    const ids = pendingImport.matched.map((s) => s.id);
    setStarred((prev) => new Set(mode === 'merge' ? [...Array.from(prev), ...ids] : ids));
    setPendingImport(null);
    setView(MY_SCHEDULE);
  };

  const block = (s: Session, opts: { left?: string; width?: string; showLocation?: boolean } = {}) => (
    <SessionBlock
      key={s.id}
      session={s}
      top={(minutesOf(s.start) - startMin) * PX_PER_MIN}
      height={(endMinutes(s) - minutesOf(s.start)) * PX_PER_MIN}
      starred={starred.has(s.id)}
      conflict={starred.has(s.id) && conflictsFor(s).length > 0}
      dimmed={filtering && !isMatch(s)}
      onToggleStar={toggleStar}
      onOpen={setOpenSession}
      {...opts}
    />
  );

  const columns =
    view === MY_SCHEDULE
      ? schedule.dates.map((d) => ({
          key: d.date,
          label: d.label,
          content: layoutLanes(starredSessions.filter((s) => s.date === d.date)).map(
            ({ session, lane, lanes }) =>
              block(session, {
                left: `${(lane / lanes) * 100}%`,
                width: `${100 / lanes}%`,
                showLocation: true,
              }),
          ),
        }))
      : schedule.locations.map((loc) => ({
          key: loc.id,
          label: loc.name,
          content: schedule.sessions
            .filter((s) => s.date === view && s.locationId === loc.id)
            .map((s) => block(s)),
        }));

  const matchCount = filtering
    ? schedule.sessions.filter(
        (s) => (view === MY_SCHEDULE ? starred.has(s.id) : s.date === view) && isMatch(s),
      ).length
    : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4">
      <Head>
        <title>Dragonsteel Nexus Schedule</title>
      </Head>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">Dragonsteel Nexus Schedule</h1>
          <p className="text-xs text-base-content/60">
            {schedule.sessions.length} sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {conflictCount > 0 && (
            <span className="badge badge-error badge-outline">
              {conflictCount} overlapping
            </span>
          )}
          <input
            ref={fileInput}
            type="file"
            accept=".ics,text/calendar"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => fileInput.current?.click()}
            title="Import a schedule .ics, e.g. one a friend exported"
          >
            <BsUpload /> Import
          </button>
          <button
            type="button"
            className="btn btn-sm"
            disabled={starredSessions.length === 0}
            onClick={exportIcs}
            title="Download your starred sessions as a calendar file"
          >
            <BsDownload /> .ics
          </button>
        </div>
      </div>

      <div role="tablist" className="tabs tabs-box mb-3 w-fit flex-wrap">
        {schedule.dates.map((d) => (
          <button
            key={d.date}
            type="button"
            role="tab"
            className={`tab ${view === d.date ? 'tab-active' : ''}`}
            onClick={() => setView(d.date)}
          >
            {shortDay(d.label)}
          </button>
        ))}
        <button
          type="button"
          role="tab"
          className={`tab gap-1 ${view === MY_SCHEDULE ? 'tab-active' : ''}`}
          onClick={() => setView(MY_SCHEDULE)}
        >
          <BsStarFill className="text-warning" /> My schedule ({starredSessions.length})
        </button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search titles, panelists, descriptions…"
          className="input input-sm input-bordered w-full max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {schedule.categories.map((c) => {
          const active = activeCategories.has(c.name);
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => toggleCategory(c.name)}
              className={`badge cursor-pointer gap-1 ${active ? 'badge-neutral' : 'badge-ghost'}`}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: c.color ?? 'currentColor' }}
              />
              {c.name}
            </button>
          );
        })}
        {filtering && (
          <>
            <span className="text-xs text-base-content/60">{matchCount} match</span>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => {
                setSearch('');
                setActiveCategories(new Set());
              }}
            >
              Clear
            </button>
          </>
        )}
      </div>

      {view === MY_SCHEDULE && starredSessions.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 p-10 text-center text-base-content/60">
          Nothing starred yet. Pick a day and hit the ☆ on any session (or open it and choose
          &ldquo;Add to my schedule&rdquo;).
        </div>
      ) : (
        <TimeGrid
          startMin={startMin}
          endMin={endMin}
          columns={columns}
          minColumnWidth={view === MY_SCHEDULE ? 220 : 170}
        />
      )}

      <SessionModal
        session={openSession}
        starred={openSession ? starred.has(openSession.id) : false}
        conflicts={openSession ? conflictsFor(openSession) : []}
        onToggleStar={toggleStar}
        onClose={() => setOpenSession(null)}
        onOpen={setOpenSession}
      />

      {pendingImport && (
        <div className="modal modal-open" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="text-lg font-bold">Import {pendingImport.fileName}</h3>
            {pendingImport.matched.length === 0 ? (
              <p className="mt-2 text-sm">
                No Dragonsteel Nexus sessions found in this file
                {pendingImport.unmatched > 0 ? ` (${pendingImport.unmatched} other events skipped)` : ''}.
              </p>
            ) : (
              <>
                <p className="mt-2 text-sm">
                  Found {pendingImport.matched.length} sessions
                  {(() => {
                    const fresh = pendingImport.matched.filter((s) => !starred.has(s.id)).length;
                    return ` (${fresh} not already in your schedule)`;
                  })()}
                  {pendingImport.unmatched > 0
                    ? `. ${pendingImport.unmatched} events didn't match a session and will be skipped.`
                    : '.'}
                </p>
                <ul className="mt-2 max-h-60 overflow-y-auto text-xs text-base-content/70">
                  {pendingImport.matched
                    .slice()
                    .sort((a, b) => a.start.localeCompare(b.start))
                    .map((s) => (
                      <li key={s.id}>
                        {starred.has(s.id) ? '★' : '☆'} {s.title}
                      </li>
                    ))}
                </ul>
              </>
            )}
            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={() => setPendingImport(null)}>
                Cancel
              </button>
              {pendingImport.matched.length > 0 && (
                <>
                  <button type="button" className="btn" onClick={() => applyImport('replace')}>
                    Replace mine
                  </button>
                  <button type="button" className="btn btn-primary" onClick={() => applyImport('merge')}>
                    Add to mine
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setPendingImport(null)} />
        </div>
      )}
    </div>
  );
}
