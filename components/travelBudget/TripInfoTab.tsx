import React from 'react';
import {
  LINE_ITEM_CATEGORIES,
  LineItemCategory,
  SharedLineItem,
  TripInfo,
} from '@/lib/travelBudget/types';
import {
  computeSharedTotal,
  formatCurrency,
} from '@/lib/travelBudget/calculations';
import { makeNewSharedItem } from '@/lib/travelBudget/storage';

interface TripInfoTabProps {
  tripInfo: TripInfo;
  onUpdate: (info: TripInfo) => void;
}

const TripInfoTab: React.FC<TripInfoTabProps> = ({ tripInfo, onUpdate }) => {
  const handleChange = <K extends keyof TripInfo>(key: K, value: TripInfo[K]) => {
    onUpdate({ ...tripInfo, [key]: value });
  };

  const updateSharedItem = (id: string, patch: Partial<SharedLineItem>) => {
    onUpdate({
      ...tripInfo,
      sharedItems: tripInfo.sharedItems.map((s) =>
        s.id === id ? { ...s, ...patch } : s,
      ),
    });
  };

  const addSharedItem = () => {
    onUpdate({
      ...tripInfo,
      sharedItems: [...tripInfo.sharedItems, makeNewSharedItem()],
    });
  };

  const removeSharedItem = (id: string) => {
    onUpdate({
      ...tripInfo,
      sharedItems: tripInfo.sharedItems.filter((s) => s.id !== id),
    });
  };

  const sharedTotal = computeSharedTotal(tripInfo.sharedItems);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-primary">Trip Info</h2>
        <p className="text-sm text-base-content/70 mt-1">
          Defaults that new options inherit, plus shared costs that apply to every
          option.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Destination</span>
          </label>
          <input
            type="text"
            className="input input-bordered"
            value={tripInfo.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            placeholder="e.g. Universal Orlando 2026"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Default Days</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              className="input input-bordered"
              value={tripInfo.defaultDays}
              onChange={(e) =>
                handleChange('defaultDays', Number(e.target.value) || 0)
              }
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold">Travelers</span>
            </label>
            <input
              type="number"
              min={1}
              step={1}
              className="input input-bordered"
              value={tripInfo.travelers}
              onChange={(e) =>
                handleChange('travelers', Number(e.target.value) || 0)
              }
            />
          </div>
        </div>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text font-semibold">Notes</span>
        </label>
        <textarea
          className="textarea textarea-bordered"
          rows={2}
          value={tripInfo.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="What are you trying to compare?"
        />
      </div>

      {/* Shared costs */}
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="card-title text-xl text-primary">Shared Costs</h3>
              <p className="text-sm text-base-content/70">
                Flat costs that apply to <strong>every</strong> option — added to
                each option&apos;s total automatically. Use these for things like
                airfare or rental cars that don&apos;t change between options.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase opacity-70">Shared total</div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(sharedTotal)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="w-44">Category</th>
                  <th>Description</th>
                  <th className="w-40 text-right">Cost</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {tripInfo.sharedItems.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center text-base-content/60 py-6">
                      No shared costs yet. Click <em>Add shared cost</em> to add
                      one.
                    </td>
                  </tr>
                )}
                {tripInfo.sharedItems.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <select
                        className="select select-bordered select-sm w-full"
                        value={item.category}
                        onChange={(e) =>
                          updateSharedItem(item.id, {
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
                          updateSharedItem(item.id, {
                            description: e.target.value,
                          })
                        }
                        placeholder="e.g. Round-trip flights"
                      />
                    </td>
                    <td>
                      <label className="input input-bordered input-sm flex items-center gap-1 px-2">
                        <span className="opacity-60">$</span>
                        <input
                          type="number"
                          min={0}
                          step="any"
                          className="w-full bg-transparent outline-none text-right"
                          value={item.value}
                          onChange={(e) =>
                            updateSharedItem(item.id, {
                              value: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </label>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => removeSharedItem(item.id)}
                        title="Remove shared cost"
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
                    Shared total
                  </td>
                  <td className="text-right font-bold text-primary">
                    {formatCurrency(sharedTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={addSharedItem}
            >
              + Add shared cost
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripInfoTab;
