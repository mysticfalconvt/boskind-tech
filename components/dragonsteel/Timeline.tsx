import React, { useEffect, useRef } from 'react';
import { formatMinutes } from '@/lib/dragonsteel/schedule';

export const TL_PX_PER_MIN = 2.4;
export const LANE_HEIGHT = 92;

type Row = { key: string; label: React.ReactNode; lanes: number; content: React.ReactNode };

type Props = {
  startMin: number;
  endMin: number;
  rows: Row[];
  /** Scroll so this time is near the left edge whenever it changes */
  scrollToMin?: number | null;
};

/**
 * Sideways calendar for narrow screens: one row per room (or day), time
 * running left to right. Row labels stick to the left edge and the hour
 * ruler sticks to the top, so a vertical slice shows everything happening
 * at that moment. Rows position their own children absolutely using
 * `(minutes - startMin) * TL_PX_PER_MIN` and `lane * LANE_HEIGHT`.
 */
export default function Timeline({ startMin, endMin, rows, scrollToMin }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const width = (endMin - startMin) * TL_PX_PER_MIN;

  useEffect(() => {
    if (scrollToMin == null || !scroller.current) return;
    scroller.current.scrollTo({
      left: Math.max(0, (scrollToMin - startMin - 15) * TL_PX_PER_MIN),
      behavior: 'smooth',
    });
  }, [scrollToMin, startMin]);
  const ticks: number[] = [];
  for (let m = startMin; m <= endMin; m += 30) ticks.push(m);
  const x = (m: number) => (m - startMin) * TL_PX_PER_MIN;

  return (
    <div ref={scroller} className="max-h-[80dvh] overflow-auto overscroll-x-contain rounded-box border border-base-300 bg-base-100">
      <div className="grid w-max" style={{ gridTemplateColumns: `4.5rem ${width}px` }}>
        <div className="sticky left-0 top-0 z-30 border-b border-r border-base-300 bg-base-200" />
        <div className="sticky top-0 z-20 h-7 border-b border-base-300 bg-base-200">
          {ticks.map((m) =>
            m % 60 === 0 && m !== startMin && m !== endMin ? (
              <div
                key={m}
                className="absolute top-1.5 -translate-x-1/2 text-xs text-base-content/60"
                style={{ left: x(m) }}
              >
                {formatMinutes(m)}
              </div>
            ) : null,
          )}
        </div>

        {rows.map((r) => (
          <React.Fragment key={r.key}>
            <div className="sticky left-0 z-10 flex items-center border-b border-r border-base-300 bg-base-200 px-1.5 text-xs font-semibold leading-tight">
              {r.label}
            </div>
            <div
              className="relative border-b border-base-300"
              style={{ height: Math.max(1, r.lanes) * LANE_HEIGHT }}
            >
              {ticks.map((m) => (
                <div
                  key={m}
                  className={`absolute inset-y-0 border-l ${
                    m % 60 === 0 ? 'border-base-300' : 'border-dashed border-base-200'
                  }`}
                  style={{ left: x(m) }}
                />
              ))}
              {r.content}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
