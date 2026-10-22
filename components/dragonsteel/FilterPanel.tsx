import React, { useEffect, useState } from 'react';
import {
  formatMinutes,
  minutesOf,
  people,
  schedule,
  Session,
} from '@/lib/dragonsteel/schedule';

type Props = {
  open: boolean;
  activeCategories: Set<string>;
  activePeople: Set<string>;
  matchCount: number | null;
  onToggleCategory: (name: string) => void;
  onTogglePerson: (name: string) => void;
  onClear: () => void;
  onOpenSession: (s: Session) => void;
  onClose: () => void;
};

const dayAbbr = (date: string) =>
  schedule.dates.find((d) => d.date === date)?.label.slice(0, 3) ?? date;

function CategoryChip({
  name,
  color,
  active,
  onClick,
}: {
  name: string;
  color: string | null;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`badge shrink-0 cursor-pointer gap-1 whitespace-nowrap ${
        active ? 'badge-neutral' : 'badge-ghost'
      }`}
    >
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: color ?? 'currentColor' }}
      />
      {name}
    </button>
  );
}

export default function FilterPanel({
  open,
  activeCategories,
  activePeople,
  matchCount,
  onToggleCategory,
  onTogglePerson,
  onClear,
  onOpenSession,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  // Selected people float to the top so they're easy to find and un-select
  const shown = people
    .filter((p) => !q || p.name.toLowerCase().includes(q))
    .sort((a, b) => Number(activePeople.has(b.name)) - Number(activePeople.has(a.name)));

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
      <div className="modal-box flex max-h-[85dvh] max-w-xl flex-col p-0">
        <div className="flex items-center justify-between border-b border-base-300 px-4 py-3">
          <h3 className="text-lg font-bold">Filters</h3>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          <h4 className="mb-2 text-sm font-semibold">Categories</h4>
          <div className="flex flex-wrap gap-2">
            {schedule.categories.map((c) => (
              <CategoryChip
                key={c.name}
                name={c.name}
                color={c.color}
                active={activeCategories.has(c.name)}
                onClick={() => onToggleCategory(c.name)}
              />
            ))}
          </div>

          <h4 className="mb-2 mt-5 text-sm font-semibold">
            People <span className="font-normal text-base-content/60">({people.length})</span>
          </h4>
          <input
            type="search"
            placeholder="Find a presenter…"
            className="input input-sm input-bordered mb-2 w-full"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="divide-y divide-base-200">
            {shown.map((p) => {
              const selected = activePeople.has(p.name);
              return (
                <li key={p.name}>
                  <label className="flex cursor-pointer items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-sm"
                      checked={selected}
                      onChange={() => onTogglePerson(p.name)}
                    />
                    <span className="flex-1 text-sm">{p.name}</span>
                    <span className="badge badge-ghost badge-sm">{p.sessions.length}</span>
                  </label>
                  {selected && (
                    <ul className="mb-2 ml-8 space-y-1">
                      {p.sessions.map((s) => (
                        <li key={s.id}>
                          <button
                            type="button"
                            className="link link-hover text-left text-xs"
                            onClick={() => onOpenSession(s)}
                          >
                            <span className="text-base-content/60">
                              {dayAbbr(s.date)} {formatMinutes(minutesOf(s.start))} ·
                            </span>{' '}
                            {s.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="py-3 text-sm text-base-content/60">No one matches “{query}”.</li>
            )}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-base-300 px-4 py-3">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear all
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onClose}>
            {matchCount === null
              ? 'Done'
              : `Show ${matchCount} ${matchCount === 1 ? 'match' : 'matches'}`}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
