import React, { useState } from 'react';
import {
  LINE_ITEM_CATEGORIES,
  LineItem,
  LineItemCategory,
  SharedLineItem,
  TripOption,
} from '@/lib/travelBudget/types';
import {
  analyzeScenario,
  computeSharedTotal,
  formatCurrency,
  getLineItemValue,
} from '@/lib/travelBudget/calculations';
import {
  makeNewLineItem,
  syncLineItemValuesToDayCounts,
} from '@/lib/travelBudget/storage';

interface OptionTabProps {
  option: TripOption;
  travelers: number;
  sharedItems: SharedLineItem[];
  onUpdate: (option: TripOption) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const OptionTab: React.FC<OptionTabProps> = ({
  option,
  travelers,
  sharedItems,
  onUpdate,
  onDuplicate,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newDayCount, setNewDayCount] = useState('');

  const updateOption = <K extends keyof TripOption>(
    key: K,
    value: TripOption[K],
  ) => {
    onUpdate({ ...option, [key]: value });
  };

  const updateLineItem = (id: string, patch: Partial<LineItem>) => {
    onUpdate({
      ...option,
      lineItems: option.lineItems.map((li) =>
        li.id === id ? { ...li, ...patch } : li,
      ),
    });
  };

  const updateLineItemValue = (id: string, dayCount: number, value: number) => {
    onUpdate({
      ...option,
      lineItems: option.lineItems.map((li) => {
        if (li.id !== id) return li;
        const updated = li.values.map((v) =>
          v.dayCount === dayCount ? { ...v, value } : v,
        );
        // If for some reason the value entry didn't exist, add it
        if (!li.values.some((v) => v.dayCount === dayCount)) {
          updated.push({ dayCount, value });
        }
        return { ...li, values: updated };
      }),
    });
  };

  const addLineItem = () => {
    onUpdate({
      ...option,
      lineItems: [...option.lineItems, makeNewLineItem(option.dayCounts)],
    });
  };

  const removeLineItem = (id: string) => {
    onUpdate({
      ...option,
      lineItems: option.lineItems.filter((li) => li.id !== id),
    });
  };

  const addDayCount = () => {
    const parsed = Number(newDayCount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    if (option.dayCounts.includes(parsed)) {
      setNewDayCount('');
      return;
    }
    const nextDayCounts = [...option.dayCounts, parsed].sort((a, b) => a - b);
    onUpdate({
      ...option,
      dayCounts: nextDayCounts,
      lineItems: syncLineItemValuesToDayCounts(option.lineItems, nextDayCounts),
    });
    setNewDayCount('');
  };

  const removeDayCount = (dc: number) => {
    if (option.dayCounts.length <= 1) return;
    const nextDayCounts = option.dayCounts.filter((d) => d !== dc);
    onUpdate({
      ...option,
      dayCounts: nextDayCounts,
      lineItems: syncLineItemValuesToDayCounts(option.lineItems, nextDayCounts),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6 flex-wrap">
        <div className="form-control flex-1 min-w-[200px]">
          <label className="label">
            <span className="label-text font-semibold">Option Name</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={option.name}
            onChange={(e) => updateOption('name', e.target.value)}
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-outline btn-primary"
            onClick={onDuplicate}
          >
            Duplicate
          </button>
          <button
            type="button"
            className="btn btn-outline btn-error"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Day-count chips */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="label-text font-semibold">Trip lengths to compare:</span>
          {option.dayCounts.map((dc) => (
            <span key={dc} className="badge badge-lg badge-primary gap-1">
              {dc} day{dc === 1 ? '' : 's'}
              {option.dayCounts.length > 1 && (
                <button
                  type="button"
                  className="ml-1 hover:opacity-70"
                  onClick={() => removeDayCount(dc)}
                  title={`Remove ${dc}-day column`}
                >
                  ✕
                </button>
              )}
            </span>
          ))}
          <div className="join">
            <input
              type="number"
              min={1}
              step={1}
              className="input input-bordered input-sm join-item w-20"
              placeholder="Days"
              value={newDayCount}
              onChange={(e) => setNewDayCount(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDayCount();
                }
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-primary join-item"
              onClick={addDayCount}
            >
              + Add column
            </button>
          </div>
        </div>
        <p className="text-xs text-base-content/60">
          Enter real values for each trip length. The summary tab will compare every
          option × length side-by-side.
        </p>
      </div>

      {/* Shared-cost banner */}
      {sharedItems.length > 0 && (
        <div className="alert alert-info">
          <div className="text-sm">
            <strong>{formatCurrency(computeSharedTotal(sharedItems))}</strong>{' '}
            in shared costs from Trip Info is added to every total below.
          </div>
        </div>
      )}

      {/* Totals cards (one row per day count) */}
      <div className="grid grid-cols-1 gap-3">
        {option.dayCounts.map((dc) => {
          const a = analyzeScenario(option, dc, travelers, sharedItems);
          return (
            <div
              key={dc}
              className="rounded-lg p-3 bg-base-300 grid grid-cols-2 md:grid-cols-5 gap-3 items-center"
            >
              <div className="text-sm font-bold text-primary">
                {dc} day{dc === 1 ? '' : 's'}
              </div>
              <StatPair label="Total" value={formatCurrency(a.total)} accent />
              <StatPair label="Per day" value={formatCurrency(a.perDay)} />
              <StatPair label="Per person" value={formatCurrency(a.perPerson)} />
              <StatPair
                label="Per pp / day"
                value={formatCurrency(a.perPersonPerDay)}
              />
            </div>
          );
        })}
      </div>

      {/* Line items */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="w-40">Category</th>
              <th>Description</th>
              {option.dayCounts.map((dc) => (
                <th key={dc} className="text-right whitespace-nowrap">
                  {dc}-day
                </th>
              ))}
              <th className="w-12" />
            </tr>
          </thead>
          <tbody>
            {option.lineItems.length === 0 && (
              <tr>
                <td
                  colSpan={3 + option.dayCounts.length}
                  className="text-center text-base-content/60 py-8"
                >
                  No line items yet. Click <em>Add line item</em> to begin.
                </td>
              </tr>
            )}
            {option.lineItems.map((item) => (
              <tr key={item.id}>
                <td>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={item.category}
                    onChange={(e) =>
                      updateLineItem(item.id, {
                        category: e.target.value as LineItemCategory,
                      })
                    }
                  >
                    {LINE_ITEM_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    value={item.description}
                    onChange={(e) =>
                      updateLineItem(item.id, { description: e.target.value })
                    }
                    placeholder="e.g. Park-to-park ticket"
                  />
                </td>
                {option.dayCounts.map((dc) => (
                  <td key={dc} className="text-right">
                    <label className="input input-bordered input-sm flex items-center gap-1 px-2">
                      <span className="opacity-60">$</span>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="w-24 bg-transparent outline-none text-right"
                        value={getLineItemValue(item, dc)}
                        onChange={(e) =>
                          updateLineItemValue(
                            item.id,
                            dc,
                            Number(e.target.value) || 0,
                          )
                        }
                      />
                    </label>
                  </td>
                ))}
                <td className="text-right">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => removeLineItem(item.id)}
                    title="Remove line item"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2} className="text-right font-semibold">
                Total
              </td>
              {option.dayCounts.map((dc) => (
                <td
                  key={dc}
                  className="text-right font-bold text-primary whitespace-nowrap"
                >
                  {formatCurrency(
                    analyzeScenario(option, dc, travelers, sharedItems).total,
                  )}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div>
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={addLineItem}
        >
          + Add line item
        </button>
      </div>

      {/* Notes */}
      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Notes</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          rows={2}
          value={option.notes || ''}
          onChange={(e) => updateOption('notes', e.target.value)}
          placeholder="What's distinct about this option?"
        />
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Delete option?</h3>
            <p className="py-4">
              Remove <strong>{option.name}</strong>? This can&apos;t be undone.
            </p>
            <div className="modal-action">
              <button
                type="button"
                className="btn btn-error"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete();
                }}
              >
                Delete
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface StatPairProps {
  label: string;
  value: string;
  accent?: boolean;
}

const StatPair: React.FC<StatPairProps> = ({ label, value, accent }) => (
  <div>
    <div className="text-xs uppercase opacity-70">{label}</div>
    <div className={`text-lg font-bold ${accent ? 'text-primary' : ''}`}>
      {value}
    </div>
  </div>
);

export default OptionTab;
