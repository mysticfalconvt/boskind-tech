import {
  LineItem,
  LineItemValue,
  LINE_ITEM_CATEGORIES,
  LineItemCategory,
  SharedLineItem,
  TravelBudgetData,
  TripOption,
} from './types';

const STORAGE_KEY = 'travel-budget-data';
export const BACKUP_STORAGE_KEY = 'travel-budget-data-backup';

export function loadTravelBudgetData(): TravelBudgetData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (!validateTravelBudgetData(parsed)) return null;
    return sanitizeObject(parsed) as TravelBudgetData;
  } catch (error) {
    console.error('Error loading travel budget data:', error);
    return null;
  }
}

export function saveTravelBudgetData(data: TravelBudgetData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving travel budget data:', error);
  }
}

export function clearTravelBudgetData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing travel budget data:', error);
  }
}

export function backupTravelBudgetData(data: TravelBudgetData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BACKUP_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error backing up travel budget data:', error);
  }
}

export function exportTravelBudgetToFile(data: TravelBudgetData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const slug =
    (data.tripInfo.destination || 'travel-budget')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'travel-budget';
  link.href = url;
  link.download = `${slug}-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importTravelBudgetFromFile(
  file: File,
): Promise<TravelBudgetData> {
  return new Promise((resolve, reject) => {
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('File too large. Maximum size is 5MB.'));
      return;
    }
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      reject(new Error('Invalid file type. Please upload a JSON file.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!validateTravelBudgetData(parsed)) {
          reject(new Error('Invalid travel budget data format'));
          return;
        }
        resolve(sanitizeObject(parsed) as TravelBudgetData);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('Invalid JSON format'));
        } else {
          reject(new Error('Error processing file'));
        }
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
}

export function validateTravelBudgetData(
  data: unknown,
): data is TravelBudgetData {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  if (
    Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
    Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
    Object.prototype.hasOwnProperty.call(obj, 'prototype')
  ) {
    return false;
  }

  if (!obj.tripInfo || typeof obj.tripInfo !== 'object') return false;
  const trip = obj.tripInfo as Record<string, unknown>;
  if (typeof trip.destination !== 'string') return false;
  if (typeof trip.defaultDays !== 'number') return false;
  if (typeof trip.travelers !== 'number') return false;
  if (!Array.isArray(trip.sharedItems)) return false;
  for (const si of trip.sharedItems) {
    if (!si || typeof si !== 'object') return false;
    const s = si as Record<string, unknown>;
    if (typeof s.id !== 'string') return false;
    if (typeof s.description !== 'string') return false;
    if (typeof s.value !== 'number') return false;
    if (typeof s.category !== 'string') return false;
    if (!LINE_ITEM_CATEGORIES.includes(s.category as LineItemCategory)) {
      return false;
    }
  }

  if (!Array.isArray(obj.options)) return false;
  for (const opt of obj.options) {
    if (!opt || typeof opt !== 'object') return false;
    const o = opt as Record<string, unknown>;
    if (typeof o.id !== 'string') return false;
    if (typeof o.name !== 'string') return false;
    if (!Array.isArray(o.dayCounts)) return false;
    if (!o.dayCounts.every((d) => typeof d === 'number')) return false;
    if (!Array.isArray(o.lineItems)) return false;
    for (const item of o.lineItems) {
      if (!item || typeof item !== 'object') return false;
      const li = item as Record<string, unknown>;
      if (typeof li.id !== 'string') return false;
      if (typeof li.description !== 'string') return false;
      if (typeof li.category !== 'string') return false;
      if (!LINE_ITEM_CATEGORIES.includes(li.category as LineItemCategory)) {
        return false;
      }
      if (!Array.isArray(li.values)) return false;
      for (const v of li.values) {
        if (!v || typeof v !== 'object') return false;
        const vv = v as Record<string, unknown>;
        if (typeof vv.dayCount !== 'number') return false;
        if (typeof vv.value !== 'number') return false;
      }
    }
  }

  return true;
}

function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  return obj;
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeNewSharedItem(
  overrides?: Partial<SharedLineItem>,
): SharedLineItem {
  return {
    id: makeId('si'),
    category: 'Transportation',
    description: '',
    value: 0,
    ...overrides,
  };
}

export function makeNewLineItem(
  dayCounts: number[],
  overrides?: Partial<LineItem>,
): LineItem {
  return {
    id: makeId('li'),
    category: 'Other',
    description: '',
    values: dayCounts.map<LineItemValue>((dc) => ({ dayCount: dc, value: 0 })),
    ...overrides,
  };
}

export function makeNewOption(
  defaults: { dayCount: number },
  overrides?: Partial<TripOption>,
): TripOption {
  return {
    id: makeId('opt'),
    name: 'New Option',
    dayCounts: [defaults.dayCount],
    lineItems: [],
    ...overrides,
  };
}

/**
 * After a day-count is added or removed on an option, line items need their
 * `values` arrays brought in sync — keep existing entries, drop removed ones,
 * and seed new ones at 0.
 */
export function syncLineItemValuesToDayCounts(
  items: LineItem[],
  dayCounts: number[],
): LineItem[] {
  return items.map((item) => {
    const byDayCount = new Map(item.values.map((v) => [v.dayCount, v.value]));
    return {
      ...item,
      values: dayCounts.map((dc) => ({
        dayCount: dc,
        value: byDayCount.get(dc) ?? 0,
      })),
    };
  });
}

export function getDefaultTravelBudgetData(): TravelBudgetData {
  return {
    tripInfo: {
      destination: 'Universal Orlando',
      defaultDays: 3,
      travelers: 4,
      notes:
        'Comparing different ways to do the same trip. Shared costs below apply to every option; each option compares itself at multiple trip lengths.',
      sharedItems: [
        {
          id: makeId('si'),
          category: 'Transportation',
          description: 'Round-trip flights (4 people)',
          value: 1400,
        },
        {
          id: makeId('si'),
          category: 'Transportation',
          description: 'Rental car / airport transfers',
          value: 300,
        },
      ],
    },
    options: [
      {
        id: makeId('opt'),
        name: 'Hotel + Express Pass',
        dayCounts: [3, 5],
        lineItems: [
          {
            id: makeId('li'),
            category: 'Lodging',
            description: 'Off-site hotel',
            values: [
              { dayCount: 3, value: 750 },
              { dayCount: 5, value: 1250 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Tickets',
            description: 'Park-to-park ticket (per length)',
            values: [
              { dayCount: 3, value: 1600 },
              { dayCount: 5, value: 1900 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Tickets',
            description: 'Express Pass add-on',
            values: [
              { dayCount: 3, value: 800 },
              { dayCount: 5, value: 1300 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Food',
            description: 'Quick service meals',
            values: [
              { dayCount: 3, value: 960 },
              { dayCount: 5, value: 1600 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Fees',
            description: 'Parking',
            values: [
              { dayCount: 3, value: 90 },
              { dayCount: 5, value: 150 },
            ],
          },
        ],
      },
      {
        id: makeId('opt'),
        name: 'On-site Premier (Express included)',
        dayCounts: [3, 5],
        lineItems: [
          {
            id: makeId('li'),
            category: 'Lodging',
            description: 'Premier hotel (Express included)',
            values: [
              { dayCount: 3, value: 1650 },
              { dayCount: 5, value: 2750 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Tickets',
            description: 'Park-to-park ticket (per length)',
            values: [
              { dayCount: 3, value: 1600 },
              { dayCount: 5, value: 1900 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Food',
            description: 'Quick service meals',
            values: [
              { dayCount: 3, value: 960 },
              { dayCount: 5, value: 1600 },
            ],
          },
        ],
      },
      {
        id: makeId('opt'),
        name: 'Annual Pass + Off-site hotel',
        dayCounts: [5, 7],
        lineItems: [
          {
            id: makeId('li'),
            category: 'Lodging',
            description: 'Off-site hotel',
            values: [
              { dayCount: 5, value: 1250 },
              { dayCount: 7, value: 1750 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Tickets',
            description: 'Annual pass (per traveler)',
            values: [
              { dayCount: 5, value: 2400 },
              { dayCount: 7, value: 2400 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Food',
            description: 'Quick service meals',
            values: [
              { dayCount: 5, value: 1600 },
              { dayCount: 7, value: 2240 },
            ],
          },
          {
            id: makeId('li'),
            category: 'Fees',
            description: 'Parking (free w/ annual pass)',
            values: [
              { dayCount: 5, value: 0 },
              { dayCount: 7, value: 0 },
            ],
          },
        ],
      },
    ],
  };
}
