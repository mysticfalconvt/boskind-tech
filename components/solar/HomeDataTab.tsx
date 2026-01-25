import React, { useState } from 'react';
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

  // Savings goal calculator state
  const [monthlySavingsGoal, setMonthlySavingsGoal] = useState(150);
  const [targetPaybackYears, setTargetPaybackYears] = useState(5);
  const [assumedSunHours, setAssumedSunHours] = useState(4);

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

  // Calculate savings goal metrics
  const annualSavingsGoal = monthlySavingsGoal * 12;
  const maxSystemCost = annualSavingsGoal * targetPaybackYears;
  const totalSavings20Years = annualSavingsGoal * 20 - maxSystemCost;
  const roi20Years = maxSystemCost > 0 ? (totalSavings20Years / maxSystemCost) * 100 : 0;

  // Estimate required system size
  // Assuming average savings of $0.20/kWh (simplified)
  const avgSavingsPerKwh = data.electricityRate || 0.20;
  const requiredAnnualProduction = annualSavingsGoal / avgSavingsPerKwh;

  // Estimate system size in kW
  // Using user-specified sun hours and 85% efficiency
  const assumedEfficiency = 0.85;
  const requiredSystemSizeKw = requiredAnnualProduction / (assumedSunHours * 365 * assumedEfficiency);

  // Estimate panel quantity (assuming 400W panels)
  const estimatedPanels = Math.ceil(requiredSystemSizeKw * 1000 / 400);

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

      {/* Savings Goal Calculator */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">Savings Goal Calculator</h3>
          <p className="text-sm opacity-70">
            Work backwards from your savings goal to estimate system requirements
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Target Monthly Savings ($)
                  </span>
                </label>
                <input
                  type="number"
                  value={monthlySavingsGoal}
                  onChange={(e) => setMonthlySavingsGoal(Number(e.target.value))}
                  className="input input-bordered input-lg"
                  min="0"
                  step="10"
                />
                <label className="label">
                  <span className="label-text-alt text-info">
                    How much do you want to reduce your monthly bill?
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Target Payback Period (years)
                  </span>
                </label>
                <input
                  type="number"
                  value={targetPaybackYears}
                  onChange={(e) => setTargetPaybackYears(Number(e.target.value))}
                  className="input input-bordered input-lg"
                  min="1"
                  max="25"
                  step="1"
                />
                <label className="label">
                  <span className="label-text-alt text-info">
                    How quickly do you want to break even?
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Peak Sun Hours/Day
                  </span>
                </label>
                <input
                  type="number"
                  value={assumedSunHours}
                  onChange={(e) => setAssumedSunHours(Number(e.target.value))}
                  className="input input-bordered"
                  min="1"
                  max="10"
                  step="0.1"
                />
                <label className="label">
                  <span className="label-text-alt text-info">
                    Based on your location (3-6 typical for most US locations)
                  </span>
                </label>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              <div className="alert alert-success">
                <div className="flex flex-col w-full">
                  <p className="font-semibold mb-2">Annual Savings Goal</p>
                  <p className="text-3xl font-bold">
                    ${annualSavingsGoal.toLocaleString()}/year
                  </p>
                </div>
              </div>

              <div className="stats stats-vertical shadow bg-base-300">
                <div className="stat">
                  <div className="stat-title">Maximum System Cost</div>
                  <div className="stat-value text-xl">
                    ${maxSystemCost.toLocaleString()}
                  </div>
                  <div className="stat-desc">
                    For {targetPaybackYears}-year payback
                  </div>
                </div>

                <div className="stat">
                  <div className="stat-title">20-Year Total Savings</div>
                  <div className="stat-value text-xl text-success">
                    ${totalSavings20Years.toLocaleString()}
                  </div>
                  <div className="stat-desc">
                    ROI: {roi20Years.toFixed(0)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="divider">Estimated System Requirements</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat bg-base-300 rounded-lg p-4">
              <div className="stat-title">Required Production</div>
              <div className="stat-value text-lg">
                {requiredAnnualProduction.toLocaleString()} kWh
              </div>
              <div className="stat-desc">
                {(requiredAnnualProduction / 365).toFixed(1).toLocaleString()} kWh/day · {Math.round(requiredAnnualProduction / 12).toLocaleString()} kWh/month
              </div>
            </div>

            <div className="stat bg-base-300 rounded-lg p-4">
              <div className="stat-title">Estimated System Size</div>
              <div className="stat-value text-lg">
                {requiredSystemSizeKw.toFixed(1)} kW
              </div>
              <div className="stat-desc">
                ~{estimatedPanels} panels @ 400W
              </div>
            </div>

            <div className="stat bg-base-300 rounded-lg p-4">
              <div className="stat-title">Coverage</div>
              <div className="stat-value text-lg">
                {((requiredAnnualProduction / data.yearlyUsageKwh) * 100).toFixed(0)}%
              </div>
              <div className="stat-desc">of your usage</div>
            </div>
          </div>

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
            <span className="text-sm">
              <strong>Note:</strong> These are rough estimates assuming {assumedSunHours} sun
              hours/day and {(assumedEfficiency * 100).toFixed(0)}% system efficiency. Actual
              requirements vary based on location, system specifications, and grid interaction
              settings. Use the System tabs to configure precise systems.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
