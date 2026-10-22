import raw from './schedule.json';

export type Session = {
  id: number;
  title: string;
  date: string;
  /** Venue-local time, `YYYY-MM-DDTHH:MM:SS` with no offset */
  start: string;
  end: string | null;
  locationId: string;
  location: string;
  categories: string[];
  panelists: string[];
  description: string;
  imageUrl: string | null;
};

export type ScheduleData = {
  event: {
    name: string;
    slug: string;
    eventId: number;
    sourceUrl: string;
    fetchedAt: string;
  };
  dates: { date: string; label: string }[];
  locations: { id: string; name: string }[];
  categories: { name: string; color: string | null }[];
  sessions: Session[];
};

export const schedule = raw as ScheduleData;

// Dragonsteel Nexus is at the Salt Palace in Salt Lake City
export const VENUE_TZ = 'America/Denver';

export const FALLBACK_COLOR = '#8a8f98';

const categoryColors = new Map(
  schedule.categories.map((c) => [c.name, c.color ?? FALLBACK_COLOR]),
);

export function sessionColor(s: Session): string {
  for (const c of s.categories) {
    const color = categoryColors.get(c);
    if (color && color !== FALLBACK_COLOR) return color;
  }
  return FALLBACK_COLOR;
}

export function categoryColor(name: string): string {
  return categoryColors.get(name) ?? FALLBACK_COLOR;
}

/** Minutes since midnight for a venue-local timestamp */
export function minutesOf(ts: string): number {
  return Number(ts.slice(11, 13)) * 60 + Number(ts.slice(14, 16));
}

export function endMinutes(s: Session): number {
  return s.end ? minutesOf(s.end) : minutesOf(s.start) + 60;
}

export function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
}

export function formatRange(s: Session): string {
  return `${formatMinutes(minutesOf(s.start))} – ${formatMinutes(endMinutes(s))}`;
}

export function overlaps(a: Session, b: Session): boolean {
  return (
    a.date === b.date &&
    minutesOf(a.start) < endMinutes(b) &&
    minutesOf(b.start) < endMinutes(a)
  );
}

export type PlacedSession = { session: Session; lane: number; lanes: number };

/**
 * Google-Calendar-style side-by-side layout: overlapping sessions are split
 * into lanes, and every session in an overlapping cluster shares its width.
 */
export function layoutLanes(sessions: Session[]): PlacedSession[] {
  const sorted = [...sessions].sort(
    (a, b) => minutesOf(a.start) - minutesOf(b.start) || endMinutes(b) - endMinutes(a),
  );
  const placed: PlacedSession[] = [];
  let cluster: PlacedSession[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const p of cluster) p.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const s of sorted) {
    const start = minutesOf(s.start);
    if (start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= start);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endMinutes(s);
    clusterEnd = Math.max(clusterEnd, endMinutes(s));
    cluster.push({ session: s, lane, lanes: 0 });
  }
  flush();
  return placed;
}

export function matchesFilters(
  s: Session,
  search: string,
  categories: Set<string>,
): boolean {
  if (categories.size > 0 && !s.categories.some((c) => categories.has(c))) {
    return false;
  }
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [s.title, s.description, s.location, ...s.panelists, ...s.categories]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/[,;]/g, (m) => `\\${m}`);
}

const icsStamp = (ts: string) => ts.replace(/[-:]/g, '').slice(0, 15);

export function buildIcs(sessions: Session[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const events = sessions.map((s) => {
    const end = s.end ?? `${s.date}T${formatHHMM(endMinutes(s))}:00`;
    const body = [s.panelists.join(', '), s.description].filter(Boolean).join('\n\n');
    return [
      'BEGIN:VEVENT',
      `UID:dragonsteel-${s.id}@boskind.tech`,
      `DTSTAMP:${now}`,
      `DTSTART;TZID=${VENUE_TZ}:${icsStamp(s.start)}`,
      `DTEND;TZID=${VENUE_TZ}:${icsStamp(end)}`,
      `SUMMARY:${icsEscape(s.title)}`,
      `LOCATION:${icsEscape(s.location)}`,
      `DESCRIPTION:${icsEscape(body)}`,
      'END:VEVENT',
    ].join('\r\n');
  });
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//boskind.tech//Dragonsteel Nexus//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
}

function formatHHMM(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

/**
 * Matches events in an .ics file back to sessions. Prefers the session id in
 * our own export's UID, falling back to title + start time so files that went
 * through another calendar app still match.
 */
export function parseIcs(text: string): { matched: Session[]; unmatched: number } {
  // Unfold continuation lines (RFC 5545: CRLF followed by a space or tab)
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const byId = new Map(schedule.sessions.map((s) => [s.id, s]));
  const byTitleStart = new Map(
    schedule.sessions.map((s) => [`${s.title.toLowerCase()}|${icsStamp(s.start)}`, s]),
  );
  const unescape = (v: string) =>
    v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1').trim();

  const matched = new Map<number, Session>();
  let unmatched = 0;
  let event: Record<string, string> | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      event = {};
      continue;
    }
    if (line === 'END:VEVENT' && event) {
      const id = event.UID?.match(/^dragonsteel-(\d+)@/)?.[1];
      const start = event.DTSTART && venueStamp(event.DTSTART);
      const s =
        (id && byId.get(Number(id))) ||
        byTitleStart.get(`${unescape(event.SUMMARY ?? '').toLowerCase()}|${start}`);
      if (s) matched.set(s.id, s);
      else unmatched += 1;
      event = null;
      continue;
    }
    if (!event) continue;
    const colon = line.indexOf(':');
    if (colon === -1) continue;
    const name = line.slice(0, colon).split(';')[0].toUpperCase();
    event[name] = line.slice(colon + 1);
  }
  return { matched: Array.from(matched.values()), unmatched };
}

/** Normalizes an .ics DTSTART value to a venue-local `YYYYMMDDTHHMMSS` stamp */
function venueStamp(value: string): string {
  if (!value.endsWith('Z')) return value.slice(0, 15);
  const d = new Date(
    value.replace(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z$/, '$1-$2-$3T$4:$5:$6Z'),
  );
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: VENUE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(d)
      .map((p) => [p.type, p.value]),
  );
  return `${parts.year}${parts.month}${parts.day}T${parts.hour}${parts.minute}${parts.second}`;
}
