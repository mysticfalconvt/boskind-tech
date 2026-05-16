// Type definitions for Travel Budget comparison tool

export type LineItemCategory =
  | 'Lodging'
  | 'Tickets'
  | 'Transportation'
  | 'Food'
  | 'Activities'
  | 'Fees'
  | 'Other';

export const LINE_ITEM_CATEGORIES: LineItemCategory[] = [
  'Lodging',
  'Tickets',
  'Transportation',
  'Food',
  'Activities',
  'Fees',
  'Other',
];

/**
 * A value entered for a specific day-count scenario, e.g. {dayCount: 3, value: 750}.
 * Each line item carries one entry per day-count its parent option is comparing.
 */
export interface LineItemValue {
  dayCount: number;
  value: number;
}

export interface LineItem {
  id: string;
  category: LineItemCategory;
  description: string;
  values: LineItemValue[];
  notes?: string;
}

export interface TripOption {
  id: string;
  name: string;
  /**
   * Day-count scenarios to compare side-by-side within this option.
   * e.g. [3] for a single duration, [2, 3, 5] for a sweep.
   */
  dayCounts: number[];
  lineItems: LineItem[];
  notes?: string;
}

/**
 * Flat-cost item that applies to every option/scenario (e.g. airfare, rental car
 * pickup fee). Doesn't vary by day count.
 */
export interface SharedLineItem {
  id: string;
  category: LineItemCategory;
  description: string;
  value: number;
  notes?: string;
}

export interface TripInfo {
  destination: string;
  defaultDays: number;
  travelers: number;
  notes?: string;
  sharedItems: SharedLineItem[];
}

export interface TravelBudgetData {
  tripInfo: TripInfo;
  options: TripOption[];
}

/**
 * Derived totals for one option at one day-count.
 */
export interface ScenarioAnalysis {
  optionId: string;
  optionName: string;
  travelers: number;
  dayCount: number;
  total: number;
  perDay: number;
  perPerson: number;
  perPersonPerDay: number;
  byCategory: Partial<Record<LineItemCategory, number>>;
}
