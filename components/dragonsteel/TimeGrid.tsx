import React from 'react';
import { formatMinutes } from '@/lib/dragonsteel/schedule';

export const PX_PER_MIN = 1.4;

type Column = { key: string; label: React.ReactNode; content: React.ReactNode };

type Props = {
  startMin: number;
  endMin: number;
  columns: Column[];
  minColumnWidth?: number;
};

/**
 * Calendar scaffold: sticky time gutter on the left, sticky column headers on
 * top, hour/half-hour gridlines. Columns position their own children
 * absolutely using `(minutes - startMin) * PX_PER_MIN`.
 */
export default function TimeGrid({ startMin, endMin, columns, minColumnWidth = 170 }: Props) {
  const height = (endMin - startMin) * PX_PER_MIN;
  const hours: number[] = [];
  for (let m = startMin; m <= endMin; m += 60) hours.push(m);

  return (
    <div className="max-h-[calc(100vh-14rem)] overflow-auto rounded-box border border-base-300 bg-base-100">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `4rem repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`,
        }}
      >
        <div className="sticky left-0 top-0 z-30 border-b border-base-300 bg-base-200" />
        {columns.map((c) => (
          <div
            key={c.key}
            className="sticky top-0 z-20 border-b border-l border-base-300 bg-base-200 px-2 py-2 text-center text-sm font-semibold"
          >
            {c.label}
          </div>
        ))}

        <div className="sticky left-0 z-10 bg-base-100" style={{ height }}>
          {hours.map((m) => (
            <div
              key={m}
              className="absolute right-2 -translate-y-1/2 text-xs text-base-content/60"
              style={{ top: (m - startMin) * PX_PER_MIN }}
            >
              {m === startMin ? '' : formatMinutes(m)}
            </div>
          ))}
        </div>
        {columns.map((c) => (
          <div key={c.key} className="relative border-l border-base-300" style={{ height }}>
            {hours.map((m) => (
              <React.Fragment key={m}>
                <div
                  className="absolute inset-x-0 border-t border-base-300"
                  style={{ top: (m - startMin) * PX_PER_MIN }}
                />
                <div
                  className="absolute inset-x-0 border-t border-dashed border-base-200"
                  style={{ top: (m + 30 - startMin) * PX_PER_MIN }}
                />
              </React.Fragment>
            ))}
            {c.content}
          </div>
        ))}
      </div>
    </div>
  );
}
