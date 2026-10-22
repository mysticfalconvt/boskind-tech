import React, { useEffect } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import {
  categoryColor,
  formatRange,
  schedule,
  Session,
} from '@/lib/dragonsteel/schedule';

type Props = {
  session: Session | null;
  starred: boolean;
  conflicts: Session[];
  onToggleStar: (id: number) => void;
  onClose: () => void;
  onOpen: (s: Session) => void;
  /** Filter the schedule to everything this presenter is in */
  onSelectPerson: (name: string) => void;
};

export default function SessionModal({
  session,
  starred,
  conflicts,
  onToggleStar,
  onClose,
  onOpen,
  onSelectPerson,
}: Props) {
  useEffect(() => {
    if (!session) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [session, onClose]);

  if (!session) return null;
  const day = schedule.dates.find((d) => d.date === session.date)?.label;

  return (
    <div className="modal modal-open modal-bottom sm:modal-middle" role="dialog" aria-modal="true">
      <div className="modal-box max-w-2xl">
        <button
          type="button"
          className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
        <h3 className="pr-8 text-xl font-bold">{session.title}</h3>
        <p className="mt-1 text-sm text-base-content/70">
          {day} · {formatRange(session)} · {session.location}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          {session.categories.map((c) => (
            <span
              key={c}
              className="badge badge-sm border-0 text-white"
              style={{ background: categoryColor(c) }}
            >
              {c}
            </span>
          ))}
        </div>

        {session.panelists.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="font-semibold">With: </span>
            {session.panelists.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && ', '}
                <button
                  type="button"
                  className="link link-hover"
                  onClick={() => onSelectPerson(p)}
                  title={`Show all sessions with ${p}`}
                >
                  {p}
                </button>
              </React.Fragment>
            ))}
          </p>
        )}

        {conflicts.length > 0 && (
          <div className="mt-3 rounded-box border border-warning bg-warning/15 px-3 py-2 text-sm">
            <div>
              <div className="font-semibold">Overlaps with your schedule:</div>
              <ul className="list-disc pl-5 text-left">
                {conflicts.map((c) => (
                  <li key={c.id}>
                    <button type="button" className="link text-left" onClick={() => onOpen(c)}>
                      {c.title}
                    </button>{' '}
                    ({formatRange(c)})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="mt-3 whitespace-pre-line text-sm leading-relaxed">
          {session.description}
        </div>

        <div className="modal-action">
          <button
            type="button"
            className={`btn ${starred ? 'btn-warning' : 'btn-primary'}`}
            onClick={() => onToggleStar(session.id)}
          >
            {starred ? <BsStarFill /> : <BsStar />}
            {starred ? 'Remove from my schedule' : 'Add to my schedule'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
