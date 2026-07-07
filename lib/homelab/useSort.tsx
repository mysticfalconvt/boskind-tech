import { useMemo, useState } from 'react';

// Small reusable client-side table sort. Give it the rows and a map of
// column-key -> value accessor; get back the sorted rows plus a `<SortableTh>`
// that renders a clickable header with an asc/desc/none indicator.
//
// Click cycles: unsorted -> asc -> desc -> unsorted. Nulls/empties always sort
// last regardless of direction. Strings compare naturally (numeric-aware).

export type SortDir = 'asc' | 'desc';
export type SortState = { key: string; dir: SortDir } | null;
export type Accessor<T> = (row: T) => string | number | null | undefined;

export function useSort<T>(
  rows: T[],
  accessors: Record<string, Accessor<T>>,
  initial: SortState = null,
) {
  const [sort, setSort] = useState<SortState>(initial);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const acc = accessors[sort.key];
    if (!acc) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = acc(a);
      const bv = acc(b);
      const aNull = av === null || av === undefined || av === '';
      const bNull = bv === null || bv === undefined || bv === '';
      if (aNull && bNull) return 0;
      if (aNull) return 1; // nulls last, always
      if (bNull) return -1;
      if (typeof av === 'number' && typeof bv === 'number') {
        return (av - bv) * dir;
      }
      return (
        String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir
      );
    });
  }, [rows, sort, accessors]);

  function toggle(key: string) {
    setSort((cur) => {
      if (!cur || cur.key !== key) return { key, dir: 'asc' };
      if (cur.dir === 'asc') return { key, dir: 'desc' };
      return null;
    });
  }

  return { sorted, sort, toggle };
}

export function SortableTh({
  label,
  sortKey,
  sort,
  toggle,
  className,
}: {
  label: string;
  sortKey: string;
  sort: SortState;
  toggle: (key: string) => void;
  className?: string;
}) {
  const active = sort?.key === sortKey;
  const arrow = active ? (sort!.dir === 'asc' ? '▲' : '▼') : '';
  return (
    <th
      className={`cursor-pointer select-none hover:bg-base-300 ${className ?? ''}`}
      onClick={() => toggle(sortKey)}
      title="click to sort"
    >
      {label} <span className="opacity-50 text-xs">{arrow}</span>
    </th>
  );
}
