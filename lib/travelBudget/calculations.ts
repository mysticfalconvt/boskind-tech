import {
  LineItem,
  LineItemCategory,
  ScenarioAnalysis,
  SharedLineItem,
  TripOption,
} from './types';

export function getLineItemValue(item: LineItem, dayCount: number): number {
  const match = item.values.find((v) => v.dayCount === dayCount);
  return match?.value ?? 0;
}

export function computeSharedTotal(items: SharedLineItem[]): number {
  return items.reduce((sum, it) => sum + (it.value || 0), 0);
}

export function computeSharedCategorySubtotals(
  items: SharedLineItem[],
): Partial<Record<LineItemCategory, number>> {
  const result: Partial<Record<LineItemCategory, number>> = {};
  for (const it of items) {
    result[it.category] = (result[it.category] || 0) + (it.value || 0);
  }
  return result;
}

export function computeScenarioOptionOnlyTotal(
  option: TripOption,
  dayCount: number,
): number {
  return option.lineItems.reduce(
    (sum, item) => sum + getLineItemValue(item, dayCount),
    0,
  );
}

export function computeOptionCategorySubtotals(
  option: TripOption,
  dayCount: number,
): Partial<Record<LineItemCategory, number>> {
  const result: Partial<Record<LineItemCategory, number>> = {};
  for (const item of option.lineItems) {
    const v = getLineItemValue(item, dayCount);
    result[item.category] = (result[item.category] || 0) + v;
  }
  return result;
}

function mergeCategoryTotals(
  a: Partial<Record<LineItemCategory, number>>,
  b: Partial<Record<LineItemCategory, number>>,
): Partial<Record<LineItemCategory, number>> {
  const out: Partial<Record<LineItemCategory, number>> = { ...a };
  for (const [k, v] of Object.entries(b) as [LineItemCategory, number][]) {
    out[k] = (out[k] || 0) + v;
  }
  return out;
}

export function analyzeScenario(
  option: TripOption,
  dayCount: number,
  travelers: number,
  sharedItems: SharedLineItem[] = [],
): ScenarioAnalysis {
  const optionOnly = computeScenarioOptionOnlyTotal(option, dayCount);
  const sharedTotal = computeSharedTotal(sharedItems);
  const total = optionOnly + sharedTotal;
  const days = Math.max(1, dayCount || 1);
  const safeTravelers = Math.max(1, travelers || 1);
  const byCategory = mergeCategoryTotals(
    computeOptionCategorySubtotals(option, dayCount),
    computeSharedCategorySubtotals(sharedItems),
  );
  return {
    optionId: option.id,
    optionName: option.name,
    travelers,
    dayCount,
    total,
    perDay: total / days,
    perPerson: total / safeTravelers,
    perPersonPerDay: total / (days * safeTravelers),
    byCategory,
  };
}

export function analyzeAllScenarios(
  options: TripOption[],
  travelers: number,
  sharedItems: SharedLineItem[] = [],
): ScenarioAnalysis[] {
  const out: ScenarioAnalysis[] = [];
  for (const opt of options) {
    for (const dc of opt.dayCounts) {
      out.push(analyzeScenario(opt, dc, travelers, sharedItems));
    }
  }
  return out;
}

export function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) return '$0';
  return `$${Math.round(value).toLocaleString()}`;
}
