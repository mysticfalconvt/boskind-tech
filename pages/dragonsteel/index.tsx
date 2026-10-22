import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  BsBarChartSteps,
  BsPeopleFill,
  BsShare,
  BsCalendar3Week,
  BsDownload,
  BsFunnel,
  BsStarFill,
  BsUpload,
} from 'react-icons/bs';
import FilterPanel from '@/components/dragonsteel/FilterPanel';
import Timeline, { LANE_HEIGHT, TL_PX_PER_MIN } from '@/components/dragonsteel/Timeline';
import SessionBlock from '@/components/dragonsteel/SessionBlock';
import SessionModal from '@/components/dragonsteel/SessionModal';
import ShareModal from '@/components/dragonsteel/ShareModal';
import TimeGrid, { PX_PER_MIN } from '@/components/dragonsteel/TimeGrid';
import {
  buildIcs,
  decodeShare,
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
const FRIEND = 'friend';

const startMin = Math.floor(Math.min(...schedule.sessions.map((s) => minutesOf(s.start))) / 60) * 60;
const endMin = Math.ceil(Math.max(...schedule.sessions.map(endMinutes)) / 60) * 60;

function shortDay(label: string) {
  // "Thursday, December 3" -> ["Thu", "Dec 3"]
  const [day, rest] = label.split(', ');
  const [month, num] = rest.split(' ');
  return [day.slice(0, 3), `${month.slice(0, 3)} ${num}`];
}

// "Lumar (Room 250)" -> ["Lumar", "Room 250"]
function splitRoom(name: string) {
  const m = name.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? [m[1], m[2]] : [name, ''];
}

// 'auto' shows the sideways timeline on phones and the room grid on wider
// screens, via CSS so the server render matches.
type Layout = 'auto' | 'timeline' | 'grid';

export default function DragonsteelPage() {
  const [view, setView] = useState<string>(schedule.dates[0].date);
  const [starred, setStarred] = useState<Set<number>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<Set<string>>(new Set());
  const [activePeople, setActivePeople] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [layout, setLayout] = useState<Layout>('auto');
  const [pendingImport, setPendingImport] = useState<{
    fileName: string;
    matched: Session[];
    unmatched: number;
  } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  // Someone else's picks, from a shared ?s=...&n=... link
  const [friend, setFriend] = useState<{ name: string; ids: Set<number> } | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const { s, n } = router.query;
    if (typeof s !== 'string' || !s) return;
    const ids = decodeShare(s);
    if (ids.length === 0) return;
    setFriend({ name: typeof n === 'string' ? n.slice(0, 40) : '', ids: new Set(ids) });
    setView(FRIEND);
  }, [router.isReady, router.query]);

  const dismissFriend = () => {
    setFriend(null);
    setView((v) => (v === FRIEND ? MY_SCHEDULE : v));
    router.replace(router.pathname, undefined, { shallow: true });
  };

  const applyFriend = (mode: 'merge' | 'replace') => {
    if (!friend) return;
    const ids = Array.from(friend.ids);
    setStarred((prev) => new Set(mode === 'merge' ? [...Array.from(prev), ...ids] : ids));
    dismissFriend();
    setView(MY_SCHEDULE);
  };

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

  const toggleIn =
    (set: React.Dispatch<React.SetStateAction<Set<string>>>) => (name: string) =>
      set((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      });
  const toggleCategory = toggleIn(setActiveCategories);
  const togglePerson = toggleIn(setActivePeople);

  const clearFilters = () => {
    setSearch('');
    setActiveCategories(new Set());
    setActivePeople(new Set());
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

  const isMatch = (s: Session) => matchesFilters(s, search, activeCategories, activePeople);
  const filterCount = activeCategories.size + activePeople.size;
  const filtering = search.trim() !== '' || filterCount > 0;

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

  const block = (
    s: Session,
    box: React.ComponentProps<typeof SessionBlock>['box'],
    opts: { showLocation?: boolean; showPanelists?: boolean } = {},
  ) => (
    <SessionBlock
      key={s.id}
      session={s}
      box={box}
      starred={starred.has(s.id)}
      conflict={starred.has(s.id) && conflictsFor(s).length > 0}
      dimmed={filtering && !isMatch(s)}
      onToggleStar={toggleStar}
      onOpen={setOpenSession}
      {...opts}
    />
  );

  // "My schedule" and a friend's shared picks are both multi-day pick views
  const pickedIds = view === MY_SCHEDULE ? starred : view === FRIEND ? friend?.ids ?? null : null;
  const pickedSessions = pickedIds ? schedule.sessions.filter((s) => pickedIds.has(s.id)) : [];
  const friendLabel = friend?.name ? `${friend.name}'s picks` : "Friend's picks";

  const myLanes = schedule.dates.map((d) =>
    layoutLanes(pickedSessions.filter((s) => s.date === d.date)),
  );
  const maxLanes = Math.max(1, ...myLanes.flat().map((p) => p.lanes));

  // Vertical grid: time runs down, one column per room (or day).
  const gridBox = (s: Session, lane = 0, lanes = 1) => {
    const height = (endMinutes(s) - minutesOf(s.start)) * PX_PER_MIN;
    return {
      box: {
        top: (minutesOf(s.start) - startMin) * PX_PER_MIN,
        height: height - 2,
        left: `calc(${(lane / lanes) * 100}% + 2px)`,
        width: `calc(${100 / lanes}% - 4px)`,
      },
      showPanelists: height >= 90,
    };
  };

  // Sideways timeline: time runs across, one row per room (or day).
  const timelineBox = (s: Session, lane = 0) => {
    const width = (endMinutes(s) - minutesOf(s.start)) * TL_PX_PER_MIN;
    return {
      box: {
        left: (minutesOf(s.start) - startMin) * TL_PX_PER_MIN + 2,
        width: width - 4,
        top: lane * LANE_HEIGHT + 3,
        height: LANE_HEIGHT - 6,
      },
      showPanelists: width >= 200,
    };
  };

  const daySessions = (locationId: string) =>
    schedule.sessions.filter((s) => s.date === view && s.locationId === locationId);

  const columns =
    pickedIds
      ? schedule.dates.map((d, i) => ({
          key: d.date,
          label: d.label,
          content: myLanes[i].map(({ session, lane, lanes }) => {
            const { box, showPanelists } = gridBox(session, lane, lanes);
            return block(session, box, { showLocation: true, showPanelists });
          }),
        }))
      : schedule.locations.map((loc) => ({
          key: loc.id,
          label: loc.name,
          content: daySessions(loc.id).map((s) => {
            const { box, showPanelists } = gridBox(s);
            return block(s, box, { showPanelists });
          }),
        }));

  const rows =
    pickedIds
      ? schedule.dates.map((d, i) => ({
          key: d.date,
          label: shortDay(d.label).join(' '),
          lanes: Math.max(1, ...myLanes[i].map((p) => p.lanes)),
          content: myLanes[i].map(({ session, lane }) => {
            const { box, showPanelists } = timelineBox(session, lane);
            return block(session, box, { showLocation: true, showPanelists });
          }),
        }))
      : schedule.locations.map((loc) => {
          const [name, room] = splitRoom(loc.name);
          return {
            key: loc.id,
            label: (
              <div>
                {name}
                {room && <div className="font-normal text-base-content/60">{room}</div>}
              </div>
            ),
            lanes: 1,
            content: daySessions(loc.id).map((s) => {
              const { box, showPanelists } = timelineBox(s);
              return block(s, box, { showPanelists });
            }),
          };
        });

  // Per-day counts so a filter that matches nothing today still points somewhere
  const matchesByDay = schedule.dates.map((d) => ({
    date: d.date,
    label: shortDay(d.label)[0],
    count: schedule.sessions.filter(
      (s) => s.date === d.date && (!pickedIds || pickedIds.has(s.id)) && isMatch(s),
    ).length,
  }));

  // Bring the earliest match into view whenever the filters change
  const firstMatchMin = filtering
    ? Math.min(
        ...schedule.sessions
          .filter((s) => (pickedIds ? pickedIds.has(s.id) : s.date === view) && isMatch(s))
          .map((s) => minutesOf(s.start)),
      )
    : null;
  const scrollToMin = firstMatchMin !== null && Number.isFinite(firstMatchMin) ? firstMatchMin : null;

  const matchCount = filtering
    ? schedule.sessions.filter(
        (s) => (pickedIds ? pickedIds.has(s.id) : s.date === view) && isMatch(s),
      ).length
    : null;

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-4">
      <Head>
        <title>Dragonsteel Nexus Schedule</title>
      </Head>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold md:text-2xl">Dragonsteel Nexus Schedule</h1>
          <p className="text-xs text-base-content/60">
            {schedule.sessions.length} sessions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            className="btn btn-sm btn-primary"
            disabled={starredSessions.length === 0}
            onClick={() => setShareOpen(true)}
            title="Get a link to your starred sessions"
          >
            <BsShare /> Share
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

      <div
        role="tablist"
        className={`tabs tabs-box mb-3 grid sm:inline-flex sm:w-fit ${
          friend ? 'grid-cols-[1fr_1fr_1fr_auto_auto]' : 'grid-cols-[1fr_1fr_1fr_auto]'
        }`}
      >
        {schedule.dates.map((d) => (
          <button
            key={d.date}
            type="button"
            role="tab"
            className={`tab gap-1 px-2 ${view === d.date ? 'tab-active' : ''}`}
            onClick={() => setView(d.date)}
          >
            {shortDay(d.label)[0]}
            <span className="hidden sm:inline">{shortDay(d.label)[1]}</span>
          </button>
        ))}
        <button
          type="button"
          role="tab"
          className={`tab gap-1 px-2 whitespace-nowrap ${view === MY_SCHEDULE ? 'tab-active' : ''}`}
          onClick={() => setView(MY_SCHEDULE)}
        >
          <BsStarFill className="text-warning" />
          <span className="sm:hidden">Mine</span>
          <span className="hidden sm:inline">My schedule</span> ({starredSessions.length})
        </button>
        {friend && (
          <button
            type="button"
            role="tab"
            className={`tab gap-1 px-2 whitespace-nowrap ${view === FRIEND ? 'tab-active' : ''}`}
            onClick={() => setView(FRIEND)}
            title={friendLabel}
          >
            <BsPeopleFill className="text-info" />
            <span className="max-w-[5rem] truncate sm:max-w-[10rem]">{friend.name || 'Friend'}</span> (
            {friend.ids.size})
          </button>
        )}
      </div>

      <div className="mb-2 flex items-center gap-2">
        <input
          type="search"
          placeholder="Search titles, panelists, descriptions…"
          className="input input-sm input-bordered min-w-0 flex-1 sm:max-w-xs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className={`btn btn-sm gap-1 ${filterCount > 0 ? 'btn-neutral' : ''}`}
          onClick={() => setFiltersOpen(true)}
          title="Filter by category or presenter"
        >
          <BsFunnel />
          <span className="hidden sm:inline">Filters</span>
          {filterCount > 0 && <span className="badge badge-sm">{filterCount}</span>}
        </button>
        <div className="join" role="group" aria-label="Layout">
          <button
            type="button"
            className={`btn join-item btn-sm ${
              layout === 'timeline' ? 'btn-active' : layout === 'auto' ? 'max-md:btn-active' : ''
            }`}
            onClick={() => setLayout('timeline')}
            aria-label="Timeline view"
            title="Timeline view (rooms as rows)"
          >
            <BsBarChartSteps />
          </button>
          <button
            type="button"
            className={`btn join-item btn-sm ${
              layout === 'grid' ? 'btn-active' : layout === 'auto' ? 'md:btn-active' : ''
            }`}
            onClick={() => setLayout('grid')}
            aria-label="Grid view"
            title="Grid view (rooms as columns)"
          >
            <BsCalendar3Week />
          </button>
        </div>
      </div>

      {filtering && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {Array.from(activeCategories).map((name) => (
            <button
              key={name}
              type="button"
              className="badge badge-neutral gap-1"
              onClick={() => toggleCategory(name)}
              aria-label={`Remove ${name} filter`}
            >
              {name} ✕
            </button>
          ))}
          {Array.from(activePeople).map((name) => (
            <button
              key={name}
              type="button"
              className="badge badge-primary gap-1"
              onClick={() => togglePerson(name)}
              aria-label={`Remove ${name} filter`}
            >
              {name} ✕
            </button>
          ))}
          <span className="text-xs text-base-content/60">
            {matchesByDay.map((d, i) => (
              <React.Fragment key={d.date}>
                {i > 0 && ' · '}
                {pickedIds || d.date === view ? (
                  <span className="font-semibold text-base-content">
                    {d.label} {d.count}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="link link-hover"
                    onClick={() => setView(d.date)}
                    title={`Show ${d.label}`}
                  >
                    {d.label} {d.count}
                  </button>
                )}
              </React.Fragment>
            ))}
          </span>
          <button type="button" className="btn btn-ghost btn-xs" onClick={clearFilters}>
            Clear
          </button>
        </div>
      )}

      {friend && view === FRIEND && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-box border border-info/40 bg-info/10 px-3 py-2 text-sm">
          <BsPeopleFill className="text-info" />
          <span className="flex-1">
            Viewing <strong>{friendLabel}</strong> ({friend.ids.size} sessions). Stars show your own
            schedule.
          </span>
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-xs" onClick={dismissFriend}>
              Dismiss
            </button>
            <button type="button" className="btn btn-xs" onClick={() => applyFriend('replace')}>
              Replace mine
            </button>
            <button type="button" className="btn btn-primary btn-xs" onClick={() => applyFriend('merge')}>
              Add all to mine
            </button>
          </div>
        </div>
      )}

      {view === MY_SCHEDULE && starredSessions.length === 0 ? (
        <div className="rounded-box border border-dashed border-base-300 p-10 text-center text-base-content/60">
          Nothing starred yet. Pick a day and hit the ☆ on any session (or open it and choose
          &ldquo;Add to my schedule&rdquo;).
        </div>
      ) : (
        <>
          {layout !== 'grid' && (
            <div className={layout === 'auto' ? 'md:hidden' : ''}>
              <Timeline startMin={startMin} endMin={endMin} rows={rows} scrollToMin={scrollToMin} />
            </div>
          )}
          {layout !== 'timeline' && (
            <div className={layout === 'auto' ? 'hidden md:block' : ''}>
              <TimeGrid
                startMin={startMin}
                endMin={endMin}
                columns={columns}
                minColumnWidth={pickedIds ? Math.max(220, maxLanes * 120) : 170}
                scrollToMin={scrollToMin}
              />
            </div>
          )}
        </>
      )}

      <ShareModal open={shareOpen} starred={starred} onClose={() => setShareOpen(false)} />

      <FilterPanel
        open={filtersOpen}
        activeCategories={activeCategories}
        activePeople={activePeople}
        matchCount={matchCount}
        onToggleCategory={toggleCategory}
        onTogglePerson={togglePerson}
        onClear={clearFilters}
        onOpenSession={setOpenSession}
        onClose={() => setFiltersOpen(false)}
      />

      <SessionModal
        session={openSession}
        starred={openSession ? starred.has(openSession.id) : false}
        conflicts={openSession ? conflictsFor(openSession) : []}
        onToggleStar={toggleStar}
        onClose={() => setOpenSession(null)}
        onOpen={setOpenSession}
        onSelectPerson={(name) => {
          setActivePeople((prev) => new Set(prev).add(name));
          setOpenSession(null);
        }}
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
