import React from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { formatRange, Session, sessionColor } from '@/lib/dragonsteel/schedule';

type Props = {
  session: Session;
  /** Absolute position/size within the grid or timeline track */
  box: Pick<React.CSSProperties, 'top' | 'left' | 'width' | 'height'>;
  showPanelists?: boolean;
  starred: boolean;
  dimmed?: boolean;
  conflict?: boolean;
  showLocation?: boolean;
  onToggleStar: (id: number) => void;
  onOpen: (s: Session) => void;
};

export default function SessionBlock({
  session,
  box,
  showPanelists,
  starred,
  dimmed,
  conflict,
  showLocation,
  onToggleStar,
  onOpen,
}: Props) {
  const color = sessionColor(session);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(session)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(session);
        }
      }}
      className={`group absolute overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm transition-all hover:z-20 hover:shadow-lg focus:z-20 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${
        dimmed ? 'opacity-25' : ''
      } ${conflict ? 'ring-2 ring-error' : starred ? 'ring-2 ring-warning' : ''}`}
      style={{
        ...box,
        borderLeftColor: color,
        background: `color-mix(in oklab, ${color} ${starred ? 32 : 16}%, var(--color-base-100))`,
      }}
      title={session.title}
    >
      <button
        type="button"
        aria-label={starred ? 'Remove from my schedule' : 'Add to my schedule'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleStar(session.id);
        }}
        className={`absolute right-1 top-1 rounded p-0.5 hover:bg-base-300 ${
          starred
            ? 'text-warning'
            : 'text-base-content/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-coarse:opacity-100'
        }`}
      >
        {starred ? <BsStarFill /> : <BsStar />}
      </button>
      <div className="pr-5 font-semibold leading-tight line-clamp-3">{session.title}</div>
      <div className="mt-0.5 text-[0.65rem] text-base-content/70">
        {formatRange(session)}
        {showLocation ? ` · ${session.location}` : ''}
      </div>
      {showPanelists && session.panelists.length > 0 && (
        <div className="mt-1 text-[0.65rem] italic text-base-content/60 line-clamp-2">
          {session.panelists.join(', ')}
        </div>
      )}
    </div>
  );
}
