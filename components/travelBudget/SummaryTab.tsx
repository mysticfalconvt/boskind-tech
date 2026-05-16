import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  LINE_ITEM_CATEGORIES,
  LineItemCategory,
  SharedLineItem,
  TripOption,
} from '@/lib/travelBudget/types';
import {
  analyzeAllScenarios,
  computeSharedTotal,
  formatCurrency,
} from '@/lib/travelBudget/calculations';

interface SummaryTabProps {
  options: TripOption[];
  travelers: number;
  sharedItems: SharedLineItem[];
}

const CATEGORY_COLORS: Record<LineItemCategory, string> = {
  Lodging: '#3b82f6',
  Tickets: '#10b981',
  Transportation: '#f59e0b',
  Food: '#ef4444',
  Activities: '#8b5cf6',
  Fees: '#6b7280',
  Other: '#14b8a6',
};

function scenarioLabel(name: string, dayCount: number): string {
  return `${name} · ${dayCount}d`;
}

const SummaryTab: React.FC<SummaryTabProps> = ({
  options,
  travelers,
  sharedItems,
}) => {
  if (options.length === 0) {
    return (
      <div className="text-center text-base-content/70 py-12">
        Add at least one option to see the comparison.
      </div>
    );
  }

  const scenarios = analyzeAllScenarios(options, travelers, sharedItems);
  const sharedTotal = computeSharedTotal(sharedItems);

  if (scenarios.length === 0) {
    return (
      <div className="text-center text-base-content/70 py-12">
        Add at least one trip length to each option to see the comparison.
      </div>
    );
  }

  const cheapestTotal = scenarios.reduce(
    (min, s) => (s.total < min ? s.total : min),
    Infinity,
  );
  const cheapestPerPpDay = scenarios.reduce(
    (min, s) => (s.perPersonPerDay < min ? s.perPersonPerDay : min),
    Infinity,
  );

  const chartData = scenarios.map((s) => {
    const row: Record<string, string | number> = {
      name: scenarioLabel(s.optionName, s.dayCount),
    };
    for (const cat of LINE_ITEM_CATEGORIES) {
      row[cat] = s.byCategory[cat] || 0;
    }
    return row;
  });

  const usedCategories = LINE_ITEM_CATEGORIES.filter((cat) =>
    scenarios.some((s) => (s.byCategory[cat] || 0) > 0),
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-primary">Comparison Summary</h2>
        <p className="text-sm text-base-content/70 mt-1">
          One row per option × trip length. Cheapest <strong>total</strong> and
          cheapest <strong>per-person-per-day</strong> are highlighted —
          per-pp-day is usually the fairer comparison across different durations.
        </p>
        {sharedTotal > 0 && (
          <p className="text-xs text-base-content/60 mt-1">
            Includes {formatCurrency(sharedTotal)} in shared costs from Trip Info.
          </p>
        )}
      </div>

      {/* Headline comparison */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">Headline</h3>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Option</th>
                  <th className="text-right">Days</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Per day</th>
                  <th className="text-right">Per person</th>
                  <th className="text-right">Per pp / day</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((s) => {
                  const isCheapestTotal = s.total === cheapestTotal;
                  const isCheapestPpd = s.perPersonPerDay === cheapestPerPpDay;
                  return (
                    <tr key={`${s.optionId}-${s.dayCount}`}>
                      <td className="font-semibold">{s.optionName}</td>
                      <td className="text-right">{s.dayCount}</td>
                      <td
                        className={`text-right ${
                          isCheapestTotal ? 'text-success font-bold' : ''
                        }`}
                      >
                        {formatCurrency(s.total)}
                      </td>
                      <td className="text-right">{formatCurrency(s.perDay)}</td>
                      <td className="text-right">
                        {formatCurrency(s.perPerson)}
                      </td>
                      <td
                        className={`text-right ${
                          isCheapestPpd ? 'text-success font-bold' : ''
                        }`}
                      >
                        {formatCurrency(s.perPersonPerDay)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category breakdown */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">
            Breakdown by Category
          </h3>
          <p className="text-sm text-base-content/70">
            Where the money goes in each scenario.
          </p>
          <div className="overflow-x-auto mt-2">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Category</th>
                  {scenarios.map((s) => (
                    <th
                      key={`${s.optionId}-${s.dayCount}`}
                      className="text-right whitespace-nowrap"
                    >
                      {scenarioLabel(s.optionName, s.dayCount)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usedCategories.map((cat) => (
                  <tr key={cat}>
                    <td className="font-semibold">{cat}</td>
                    {scenarios.map((s) => (
                      <td
                        key={`${s.optionId}-${s.dayCount}-${cat}`}
                        className="text-right"
                      >
                        {formatCurrency(s.byCategory[cat] || 0)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="font-bold">Total</td>
                  {scenarios.map((s) => (
                    <td
                      key={`${s.optionId}-${s.dayCount}-total`}
                      className={`text-right font-bold ${
                        s.total === cheapestTotal ? 'text-success' : ''
                      }`}
                    >
                      {formatCurrency(s.total)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">
            Stacked Cost Comparison
          </h3>
          <div className="h-96 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip
                  formatter={(value) =>
                    formatCurrency(typeof value === 'number' ? value : 0)
                  }
                />
                <Legend />
                {usedCategories.map((cat) => (
                  <Bar
                    key={cat}
                    dataKey={cat}
                    stackId="a"
                    fill={CATEGORY_COLORS[cat]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;
