// Pulls the Dragonsteel Nexus schedule from the Leap Event Tech AJAX endpoints
// (the same ones their schedule page calls) and writes a normalized JSON file.
//
//   node scripts/fetchDragonsteelSchedule.mjs

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://conventions.leapevent.tech';
const SLUG = 'Dragonsteel_Nexus';
const EVENT_ID = 21268;
const OUT = join(
  dirname(fileURLToPath(import.meta.url)),
  '../lib/dragonsteel/schedule.json',
);

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'Mozilla/5.0',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  const json = await res.json();
  if (!json.success) throw new Error(`${path}: success=false`);
  return json;
}

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};
const decode = (s) =>
  s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m]);

// Descriptions look like "<i>Panelist, Panelist</i><br /><br />Body..."
function parseDescription(html) {
  let rest = html ?? '';
  let panelists = [];
  const m = rest.match(/^\s*<i>(.*?)<\/i>(\s*<br\s*\/?>)*/i);
  if (m) {
    panelists = decode(m[1].replace(/<[^>]+>/g, ''))
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    rest = rest.slice(m[0].length);
  }
  const description = decode(
    rest.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { panelists, description };
}

// The API labels venue-local times as +00:00; drop the bogus offset.
const localTime = (iso) => iso.replace(/([+-]\d\d:\d\d|Z)$/, '');

const filters = await post('/ed/filters_ajax', { event_slug: SLUG });
const { dates } = await post('/ed/schedule_dates_ajax', {
  event_slug: SLUG,
  search: '',
  category_ids: [],
  location_ids: [],
});

const sessions = [];
// The filters endpoint omits some categories sessions use, so collect from both.
const categories = new Map(
  filters.categories.map((c) => [c.name, c.highlight_color || null]),
);
for (const d of dates) {
  const { schedules } = await post(`/schedules/schedules_ajax/${EVENT_ID}`, {
    event_slug: SLUG,
    search: '',
    date: d.date_raw,
    sort: 'start_time:asc',
    category_ids: [],
    location_ids: [],
  });
  for (const s of Object.values(schedules).flat()) {
    const { panelists, description } = parseDescription(s.description);
    sessions.push({
      id: s.id,
      title: decode(s.title).trim(),
      date: d.date_raw,
      start: localTime(s.start_time),
      end: s.no_end_time ? null : localTime(s.end_time),
      locationId: String(s.location?.id ?? ''),
      location: s.location?.name?.replace(/\s+/g, ' ').trim() ?? '',
      categories: (s.categories ?? []).map((c) => {
        if (!categories.get(c.name)) categories.set(c.name, c.highlight_color || null);
        return c.name;
      }),
      panelists,
      description,
      imageUrl: s.file_url || null,
    });
  }
}
sessions.sort(
  (a, b) => a.start.localeCompare(b.start) || a.location.localeCompare(b.location),
);

const usedLocations = new Set(sessions.map((s) => s.locationId));
const data = {
  event: {
    name: 'Dragonsteel Nexus',
    slug: SLUG,
    eventId: EVENT_ID,
    sourceUrl: `${BASE}/ed/schedule/${SLUG}`,
    fetchedAt: new Date().toISOString(),
  },
  dates: dates.map((d) => ({ date: d.date_raw, label: `${d.day_name}, ${d.month_name} ${d.day}` })),
  locations: filters.locations
    .filter((l) => usedLocations.has(l.id))
    .map((l) => ({ id: l.id, name: l.name.replace(/\s+/g, ' ').trim() })),
  categories: Array.from(categories)
    .map(([name, color]) => ({ name, color }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  sessions,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');
console.log(`Wrote ${sessions.length} sessions across ${dates.length} days to ${OUT}`);
