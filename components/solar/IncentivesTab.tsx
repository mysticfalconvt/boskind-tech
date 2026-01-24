import React from 'react';
import { Incentives } from '@/lib/solar/types';

interface IncentivesTabProps {
  data: Incentives;
  onUpdate: (data: Incentives) => void;
}

export default function IncentivesTab({ data, onUpdate }: IncentivesTabProps) {
  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl text-primary">Solar Incentives</h2>
          <p className="text-sm text-base-content/70">
            Enter any tax credits, rebates, or incentives you're eligible for
          </p>

          <div className="alert alert-info mt-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>
              Note: The federal 30% solar tax credit (ITC) has expired. Check your state and
              local utility for current incentive programs.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Federal Tax Credit (%)
                </span>
              </label>
              <input
                type="number"
                value={data.federalTaxCreditPercent}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    federalTaxCreditPercent: Number(e.target.value),
                  })
                }
                className="input input-bordered"
                min="0"
                max="100"
                step="1"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Enter percentage if applicable in your area
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">State Rebate ($)</span>
              </label>
              <input
                type="number"
                value={data.stateRebate}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    stateRebate: Number(e.target.value),
                  })
                }
                className="input input-bordered"
                min="0"
                step="100"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  One-time state rebate amount
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Local Utility Incentives ($)
                </span>
              </label>
              <input
                type="number"
                value={data.localUtilityIncentives}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    localUtilityIncentives: Number(e.target.value),
                  })
                }
                className="input input-bordered"
                min="0"
                step="100"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Local utility company incentives
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  SREC Value ($/year)
                </span>
              </label>
              <input
                type="number"
                value={data.srecValuePerYear}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    srecValuePerYear: Number(e.target.value),
                  })
                }
                className="input input-bordered"
                min="0"
                step="10"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Solar Renewable Energy Credits (annual)
                </span>
              </label>
            </div>
          </div>

          <div className="divider"></div>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-2">
              <input
                type="checkbox"
                className="checkbox checkbox-primary"
                checked={data.applyToAllSystems}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    applyToAllSystems: e.target.checked,
                  })
                }
              />
              <span className="label-text font-semibold">
                Apply these incentives to all systems
              </span>
            </label>
            <label className="label">
              <span className="label-text-alt text-info">
                If unchecked, you can set different incentives per system (future feature)
              </span>
            </label>
          </div>

          {/* Summary */}
          <div className="card bg-gradient-to-br from-success to-info text-success-content shadow-lg mt-6">
            <div className="card-body">
              <h3 className="card-title">Total Incentives Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm opacity-70">Federal Tax Credit</p>
                  <p className="text-2xl font-bold">
                    {data.federalTaxCreditPercent}% of system cost
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-70">Total Fixed Rebates</p>
                  <p className="text-2xl font-bold">
                    ${(data.stateRebate + data.localUtilityIncentives).toLocaleString()}
                  </p>
                </div>
                {data.srecValuePerYear > 0 && (
                  <div className="sm:col-span-2">
                    <p className="text-sm opacity-70">Annual SREC Income (25 years)</p>
                    <p className="text-2xl font-bold">
                      ${(data.srecValuePerYear * 25).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
