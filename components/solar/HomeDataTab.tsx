import React from 'react';
import { HomeEnergyData } from '@/lib/solar/types';
import {
  calculateYearlyEnergyCost,
  calculateMonthlyAverages,
  calculateDailyAverages,
} from '@/lib/solar/calculations';

interface HomeDataTabProps {
  data: HomeEnergyData;
  onUpdate: (data: HomeEnergyData) => void;
}

export default function HomeDataTab({ data, onUpdate }: HomeDataTabProps) {
  const yearlyTotal = calculateYearlyEnergyCost(data);
  const monthlyAvg = calculateMonthlyAverages(data);
  const dailyAvg = calculateDailyAverages(data);

  const handleYearlyUsageChange = (value: number) => {
    onUpdate({
      ...data,
      yearlyUsageKwh: value,
      monthlyUsageKwh: value / 12,
    });
  };

  const handleMonthlyUsageChange = (value: number) => {
    onUpdate({
      ...data,
      monthlyUsageKwh: value,
      yearlyUsageKwh: value * 12,
    });
  };

  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl text-primary">Home Energy Data</h2>
          <p className="text-sm text-base-content/70">
            Enter your current electricity usage and rates
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Usage Inputs */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Yearly Usage (kWh)</span>
              </label>
              <input
                type="number"
                value={data.yearlyUsageKwh}
                onChange={(e) => handleYearlyUsageChange(Number(e.target.value))}
                className="input input-bordered"
                min="0"
                step="100"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Check your annual bill or utility statements
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Monthly Usage (kWh)</span>
              </label>
              <input
                type="number"
                value={Math.round(data.monthlyUsageKwh)}
                onChange={(e) => handleMonthlyUsageChange(Number(e.target.value))}
                className="input input-bordered"
                min="0"
                step="10"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Average monthly consumption
                </span>
              </label>
            </div>

            {/* Rate Inputs */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Electricity Rate ($/kWh)
                </span>
              </label>
              <input
                type="number"
                value={data.electricityRate}
                onChange={(e) =>
                  onUpdate({ ...data, electricityRate: Number(e.target.value) })
                }
                className="input input-bordered"
                min="0"
                step="0.01"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  What you pay per kWh
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Grid Buy-Back Rate ($/kWh)
                </span>
              </label>
              <input
                type="number"
                value={data.gridBuybackRate}
                onChange={(e) =>
                  onUpdate({ ...data, gridBuybackRate: Number(e.target.value) })
                }
                className="input input-bordered"
                min="0"
                step="0.01"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  What utility pays you for excess power
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Monthly Fixed Costs ($)
                </span>
              </label>
              <input
                type="number"
                value={data.monthlyFixedCosts}
                onChange={(e) =>
                  onUpdate({ ...data, monthlyFixedCosts: Number(e.target.value) })
                }
                className="input input-bordered"
                min="0"
                step="1"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Service charges, delivery fees, etc.
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Energy Inflation Rate (%)
                </span>
              </label>
              <input
                type="number"
                value={data.energyInflationRate}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    energyInflationRate: Number(e.target.value),
                  })
                }
                className="input input-bordered"
                min="0"
                step="0.1"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Expected annual rate increase (default 3%)
                </span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  HYSA Interest Rate (%)
                </span>
              </label>
              <input
                type="number"
                value={data.hysaRate || 4.5}
                onChange={(e) =>
                  onUpdate({
                    ...data,
                    hysaRate: Number(e.target.value),
                  })
                }
                className="input input-bordered"
                min="0"
                max="15"
                step="0.1"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  High-Yield Savings Account rate for opportunity cost analysis (default 4.5%)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Calculated Summary */}
      <div className="card bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl">Current Energy Costs</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div className="stat bg-base-100/10 rounded-lg p-4">
              <div className="stat-title text-primary-content/70">
                Yearly Total
              </div>
              <div className="stat-value text-2xl">
                ${yearlyTotal.toFixed(2)}
              </div>
              <div className="stat-desc text-primary-content/70">
                {data.yearlyUsageKwh.toLocaleString()} kWh/year
              </div>
            </div>

            <div className="stat bg-base-100/10 rounded-lg p-4">
              <div className="stat-title text-primary-content/70">
                Monthly Average
              </div>
              <div className="stat-value text-2xl">
                ${monthlyAvg.avgMonthlyCost.toFixed(2)}
              </div>
              <div className="stat-desc text-primary-content/70">
                {Math.round(monthlyAvg.avgMonthlyKwh)} kWh/month
              </div>
            </div>

            <div className="stat bg-base-100/10 rounded-lg p-4">
              <div className="stat-title text-primary-content/70">
                Daily Average
              </div>
              <div className="stat-value text-2xl">
                ${dailyAvg.avgDailyCost.toFixed(2)}
              </div>
              <div className="stat-desc text-primary-content/70">
                {Math.round(dailyAvg.avgDailyKwh)} kWh/day
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
