import React, { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
} from 'recharts';
import { HomeEnergyData, SolarSystem, Incentives, FinancingOption } from '@/lib/solar/types';
import {
  calculateSystemFinancialAnalysis,
  calculateProductionConsumption,
  calculateProductionWithDegradation,
  calculateAnnualSavings,
  calculateLoanPayback,
  calculateNetSavings,
  calculateROI,
  calculateOpportunityCost,
} from '@/lib/solar/calculations';
import { calculateBatteryPerformance } from '@/lib/solar/batteryCalculations';

interface SummaryTabProps {
  homeEnergyData: HomeEnergyData;
  systems: SolarSystem[];
  incentives: Incentives;
}

export default function SummaryTab({
  homeEnergyData,
  systems,
  incentives,
}: SummaryTabProps) {
  const [selectedFinancing, setSelectedFinancing] = useState<{
    [systemId: string]: FinancingOption;
  }>({});
  const [timeHorizonYears, setTimeHorizonYears] = useState(25);

  // Get theme-aware color for breakeven line
  // Use a medium gray that's visible in both light and dark modes
  const breakevenColor = '#999999';

  // Initialize financing options for all systems if not set
  React.useEffect(() => {
    const newFinancing: { [systemId: string]: FinancingOption } = {};
    systems.forEach((system) => {
      if (!selectedFinancing[system.id]) {
        newFinancing[system.id] = { type: 'cash' };
      }
    });
    if (Object.keys(newFinancing).length > 0) {
      setSelectedFinancing((prev) => ({ ...prev, ...newFinancing }));
    }
  }, [systems]);

  const getFinancingForSystem = (systemId: string): FinancingOption => {
    return (
      selectedFinancing[systemId] || {
        type: 'cash',
      }
    );
  };

  const updateFinancing = (systemId: string, financing: FinancingOption) => {
    setSelectedFinancing((prev) => ({
      ...prev,
      [systemId]: financing,
    }));
  };

  // Helper to calculate actual down payment amount for a system
  const getDownPaymentAmount = (system: SolarSystem, totalCost: number): number => {
    const mode = system.downPaymentMode || 'percent';
    if (mode === 'percent') {
      return totalCost * ((system.loanDownPaymentPercent || 20) / 100);
    }
    return system.loanDownPaymentDollar || 0;
  };

  // Helper to get down payment percent for a given system cost
  const getDownPaymentPercent = (system: SolarSystem, totalCost: number): number => {
    const mode = system.downPaymentMode || 'percent';
    if (mode === 'percent') {
      return system.loanDownPaymentPercent || 20;
    }
    const dollarAmount = system.loanDownPaymentDollar || 0;
    return totalCost > 0 ? (dollarAmount / totalCost) * 100 : 0;
  };

  // Helper to estimate wasted power for off-grid without battery
  // Solar production is concentrated during daylight hours (~6-8 hours peak)
  // but consumption is spread across 24 hours
  const estimateOffGridWaste = (annualProduction: number, annualConsumption: number): {
    wastedKwh: number;
    usableKwh: number;
    mustPurchaseKwh: number;
  } => {
    // Assume solar generates during ~30% of the day (peak sun hours)
    // and consumption is relatively constant across 24 hours
    const solarGenerationWindowPercent = 0.30; // ~7-8 hours of the 24-hour day
    const averageHourlyConsumption = annualConsumption / 8760; // kWh per hour
    const averageHourlyProduction = annualProduction / (8760 * solarGenerationWindowPercent);

    // During solar generation hours, you can only use what you produce up to your consumption
    const hoursWithSolar = 8760 * solarGenerationWindowPercent;
    const consumptionDuringSolarHours = averageHourlyConsumption * hoursWithSolar;
    const usableFromSolar = Math.min(annualProduction, consumptionDuringSolarHours);

    // Anything produced beyond your consumption during solar hours is wasted
    const wastedProduction = Math.max(0, annualProduction - consumptionDuringSolarHours);

    // During non-solar hours, you must purchase all your power
    const hoursWithoutSolar = 8760 * (1 - solarGenerationWindowPercent);
    const consumptionDuringNonSolarHours = averageHourlyConsumption * hoursWithoutSolar;

    return {
      wastedKwh: wastedProduction,
      usableKwh: usableFromSolar,
      mustPurchaseKwh: consumptionDuringNonSolarHours,
    };
  };

  // Helper to estimate seasonal grid interaction patterns
  const estimateGridInteraction = (
    annualProduction: number,
    annualConsumption: number,
    gridBuyRate: number, // what you pay to buy from grid
    gridSellRate: number, // what grid pays you for excess
    hasNetMetering: boolean
  ): {
    summer: { exported: number; imported: number; netCost: number };
    winter: { exported: number; imported: number; netCost: number };
    dayExcess: number; // typical daytime excess production
    nightDeficit: number; // typical nighttime deficit
    annualBuyFromGrid: number;
    annualSellToGrid: number;
    costToBuy: number;
    revenueFromSelling: number;
    rateDifferenceImpact: number; // how much you lose from rate difference
    batteryArbitrageValue: number; // potential value of battery for rate arbitrage
  } => {
    // Seasonal breakdown (simplified: 60% summer, 40% winter for solar)
    const summerProduction = annualProduction * 0.60;
    const winterProduction = annualProduction * 0.40;
    const summerConsumption = annualConsumption * 0.48; // Slightly less in shoulder seasons
    const winterConsumption = annualConsumption * 0.52; // Higher in winter

    // Day/night patterns (solar generates during ~30% of day)
    const dailyProduction = annualProduction / 365;
    const dailyConsumption = annualConsumption / 365;
    const daytimeConsumptionPercent = 0.40; // ~40% of daily consumption during daylight
    const nighttimeConsumptionPercent = 0.60; // ~60% at night/evening

    const daytimeConsumption = dailyConsumption * daytimeConsumptionPercent;
    const nighttimeConsumption = dailyConsumption * nighttimeConsumptionPercent;

    // Daytime: production vs consumption
    const dayExcess = Math.max(0, dailyProduction - daytimeConsumption);
    // Nighttime: all consumption must come from grid (without battery)
    const nightDeficit = nighttimeConsumption;

    // Summer analysis
    const summerDailyProd = summerProduction / (365 * 0.5); // ~180 summer days
    const summerDailyCons = summerConsumption / (365 * 0.5);
    const summerExported = Math.max(0, summerProduction - summerConsumption);
    const summerImported = nightDeficit * (365 * 0.5) + Math.max(0, summerConsumption - summerProduction);

    // Winter analysis
    const winterDailyProd = winterProduction / (365 * 0.5); // ~185 winter days
    const winterDailyCons = winterConsumption / (365 * 0.5);
    const winterExported = Math.max(0, winterProduction - winterConsumption);
    const winterImported = nightDeficit * (365 * 0.5) + Math.max(0, winterConsumption - winterProduction);

    // Annual totals
    const annualExported = Math.max(0, annualProduction - annualConsumption);
    const annualExportedActual = hasNetMetering ? annualExported : 0;

    // Without battery: must buy all nighttime power + any production shortfall
    const annualImported = (nightDeficit * 365) + Math.max(0, annualConsumption - annualProduction);

    const costToBuy = annualImported * gridBuyRate;
    const revenueFromSelling = annualExportedActual * gridSellRate;

    // Rate difference impact: how much money you lose because sell rate < buy rate
    const rateDifference = gridBuyRate - gridSellRate;
    const rateDifferenceImpact = annualExportedActual * rateDifference;

    // Battery arbitrage value: store daytime excess, use at night instead of buying
    // Battery could save you from buying at high rate vs selling at low rate
    const potentialShiftableEnergy = Math.min(dayExcess * 365, nightDeficit * 365);
    const batteryArbitrageValue = potentialShiftableEnergy * rateDifference;

    return {
      summer: {
        exported: summerExported,
        imported: summerImported,
        netCost: summerImported * gridBuyRate - (hasNetMetering ? summerExported * gridSellRate : 0),
      },
      winter: {
        exported: winterExported,
        imported: winterImported,
        netCost: winterImported * gridBuyRate - (hasNetMetering ? winterExported * gridSellRate : 0),
      },
      dayExcess,
      nightDeficit,
      annualBuyFromGrid: annualImported,
      annualSellToGrid: annualExportedActual,
      costToBuy,
      revenueFromSelling,
      rateDifferenceImpact,
      batteryArbitrageValue,
    };
  };

  // Calculate financial analysis for all systems
  const analyses = systems.map((system) =>
    calculateSystemFinancialAnalysis(
      homeEnergyData,
      system,
      incentives,
      getFinancingForSystem(system.id)
    )
  );

  // Calculate production/consumption for all systems
  const prodCons = systems.map((system) =>
    calculateProductionConsumption(homeEnergyData, system)
  );

  // Calculate battery performance for systems with batteries
  const batteryPerf = systems.map((system) =>
    calculateBatteryPerformance(homeEnergyData, system)
  );

  // Generate cumulative savings data for chart based on time horizon
  const cumulativeSavingsData = Array.from({ length: timeHorizonYears + 1 }, (_, i) => {
    const dataPoint: any = { year: i };

    systems.forEach((system, idx) => {
      let cumulative = -analyses[idx].totalCostAfterIncentives;

      for (let y = 1; y <= i; y++) {
        const production = calculateProductionWithDegradation(
          system.specifications.annualProductionKwh,
          y,
          system.specifications.degradationRate
        );
        const savings = calculateAnnualSavings(
          homeEnergyData,
          production,
          y,
          system.specifications.gridInteraction.gridFeedRate,
          system.specifications.gridInteraction.netMeteringEnabled
        );
        cumulative += savings;

        // Subtract loan payments if applicable
        const financing = getFinancingForSystem(system.id);
        if (financing.type === 'loan' && financing.loanDetails && y <= financing.loanDetails.termYears) {
          cumulative -= (analyses[idx].loanMonthlyPayment || 0) * 12;
        }
      }

      dataPoint[system.name] = Math.round(cumulative);
    });

    return dataPoint;
  });

  // Calculate breakeven points for each system
  const breakevenPoints: { [systemName: string]: { year: number; value: number } | null } = {};
  systems.forEach((system, idx) => {
    let prevCumulative = -analyses[idx].totalCostAfterIncentives;
    let breakevenYear: number | null = null;

    for (let y = 1; y <= timeHorizonYears; y++) {
      const production = calculateProductionWithDegradation(
        system.specifications.annualProductionKwh,
        y,
        system.specifications.degradationRate
      );
      const savings = calculateAnnualSavings(
        homeEnergyData,
        production,
        y,
        system.specifications.gridInteraction.gridFeedRate,
        system.specifications.gridInteraction.netMeteringEnabled
      );
      let cumulative = prevCumulative + savings;

      // Subtract loan payments if applicable
      const financing = getFinancingForSystem(system.id);
      if (financing.type === 'loan' && financing.loanDetails && y <= financing.loanDetails.termYears) {
        cumulative -= (analyses[idx].loanMonthlyPayment || 0) * 12;
      }

      // Check if we crossed zero
      if (prevCumulative < 0 && cumulative >= 0) {
        // Linear interpolation to find exact breakeven
        const fraction = -prevCumulative / (cumulative - prevCumulative);
        breakevenYear = y - 1 + fraction;
        break;
      }

      prevCumulative = cumulative;
    }

    if (breakevenYear !== null) {
      breakevenPoints[system.name] = {
        year: breakevenYear,
        value: 0,
      };
    } else {
      breakevenPoints[system.name] = null;
    }
  });

  // Production vs Consumption chart data
  const prodConsChartData = systems.map((system, idx) => ({
    name: system.name,
    production: prodCons[idx].annualProduction,
    consumption: prodCons[idx].annualConsumption,
  }));

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (systems.length === 0) {
    return (
      <div className="alert alert-warning">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>Add at least one solar system to see the summary and comparison.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comparison Table */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl text-primary">System Comparison</h2>

          <div className="overflow-x-auto mt-4">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>System</th>
                  <th>Total Cost</th>
                  <th>After Incentives</th>
                  <th>Annual Production</th>
                  <th>Year 1 Savings</th>
                  <th>Payback Period</th>
                  <th>25-Year Net</th>
                  <th>ROI</th>
                </tr>
              </thead>
              <tbody>
                {systems.map((system, idx) => {
                  const analysis = analyses[idx];
                  return (
                    <tr key={system.id}>
                      <td className="font-semibold">{system.name}</td>
                      <td>${analysis.totalCost.toLocaleString()}</td>
                      <td>${analysis.totalCostAfterIncentives.toLocaleString()}</td>
                      <td>{analysis.annualProductionKwh.toLocaleString()} kWh</td>
                      <td className="text-success">
                        ${analysis.annualSavingsYear1.toLocaleString()}
                      </td>
                      <td>
                        {analysis.simplePaybackYears === Infinity
                          ? 'Never'
                          : `${analysis.simplePaybackYears.toFixed(1)} years`}
                      </td>
                      <td
                        className={
                          analysis.net25YearSavings > 0 ? 'text-success' : 'text-error'
                        }
                      >
                        ${analysis.net25YearSavings.toLocaleString()}
                      </td>
                      <td
                        className={analysis.roiPercent > 0 ? 'text-success' : 'text-error'}
                      >
                        {analysis.roiPercent.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Note: Financing parameters are configured per-system in each System tab */}

      {/* Cumulative Savings Chart with Time Slider */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">
            Cumulative Savings Over Time
          </h3>

          {/* Time Range Slider */}
          <div className="mt-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold">Time Horizon: {timeHorizonYears} years</label>
              <div className="flex gap-2 flex-wrap">
                {systems.map((system, idx) => {
                  const financing = getFinancingForSystem(system.id);
                  const analysis = analyses[idx];

                  // Calculate appropriate payback based on financing type
                  let paybackYears = analysis.simplePaybackYears;
                  let label = 'Cash';

                  if (financing.type === 'loan' && financing.loanDetails && analysis.loanMonthlyPayment) {
                    const downPayment = getDownPaymentAmount(system, analysis.totalCostAfterIncentives);
                    paybackYears = calculateLoanPayback(
                      homeEnergyData,
                      system,
                      downPayment,
                      analysis.loanMonthlyPayment,
                      financing.loanDetails.termYears
                    );
                    label = 'Loan';
                  }

                  return (
                    <button
                      key={system.id}
                      className="badge badge-sm cursor-pointer hover:brightness-110 transition-all"
                      style={{ backgroundColor: colors[idx % colors.length] }}
                      onClick={() => {
                        if (paybackYears !== Infinity) {
                          const targetYears = Math.max(5, Math.min(30, Math.ceil(paybackYears)));
                          setTimeHorizonYears(targetYears);
                        }
                      }}
                      title={`Click to set time horizon to ${paybackYears === Infinity ? 'N/A' : Math.max(5, Math.min(30, Math.ceil(paybackYears))) + ' years'}`}
                    >
                      <span className="text-white text-xs">
                        {system.name} ({label}): {paybackYears === Infinity ? 'Never' : `${paybackYears.toFixed(1)}y`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={timeHorizonYears}
              onChange={(e) => setTimeHorizonYears(Number(e.target.value))}
              className="range range-primary w-full"
              step="1"
            />
            <div className="w-full flex justify-between text-xs mt-1">
              <span>5y</span>
              <span>10y</span>
              <span>15y</span>
              <span>20y</span>
              <span>25y</span>
              <span>30y</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={cumulativeSavingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" label={{ value: 'Year', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Cumulative Savings ($)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => value !== undefined ? `$${value.toLocaleString()}` : ''} />
              <Legend />

              {/* Zero line - prominent to show breakeven */}
              <ReferenceLine
                y={0}
                stroke={breakevenColor}
                strokeWidth={2}
                label={{ value: 'Break Even', position: 'insideTopRight', fill: breakevenColor, fontWeight: 'bold' }}
              />

              {/* System lines */}
              {systems.map((system, idx) => (
                <Line
                  key={system.id}
                  type="monotone"
                  dataKey={system.name}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))}

              {/* Breakeven dots */}
              {systems.map((system, idx) => {
                const breakeven = breakevenPoints[system.name];
                if (breakeven) {
                  return (
                    <ReferenceDot
                      key={`breakeven-${system.id}`}
                      x={breakeven.year}
                      y={0}
                      r={8}
                      fill={colors[idx % colors.length]}
                      stroke="#fff"
                      strokeWidth={2}
                      label={{
                        value: `${system.name}: ${breakeven.year.toFixed(1)}y`,
                        position: 'top',
                        fill: colors[idx % colors.length],
                        fontWeight: 'bold',
                        fontSize: 12,
                      }}
                    />
                  );
                }
                return null;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Production vs Consumption Chart */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">
            Annual Production vs Consumption
          </h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={prodConsChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: 'kWh', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => value !== undefined ? `${value.toLocaleString()} kWh` : ''} />
              <Legend />
              <Bar dataKey="production" fill="#10b981" name="Solar Production" />
              <Bar dataKey="consumption" fill="#f59e0b" name="Home Consumption" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-System Deep Dives */}
      {systems.map((system, idx) => {
        const analysis = analyses[idx];
        const pc = prodCons[idx];
        const bp = batteryPerf[idx];

        // Calculate all three financing scenarios
        const cashAnalysis = calculateSystemFinancialAnalysis(
          homeEnergyData,
          system,
          incentives,
          { type: 'cash' }
        );
        const loanAnalysis = calculateSystemFinancialAnalysis(
          homeEnergyData,
          system,
          incentives,
          {
            type: 'loan',
            loanDetails: {
              interestRate: system.loanInterestRate || 6,
              termYears: system.loanTermYears || 15,
              downPaymentPercent: getDownPaymentPercent(system, cashAnalysis.totalCostAfterIncentives),
            },
          }
        );
        const opportunityAnalysis = calculateSystemFinancialAnalysis(
          homeEnergyData,
          system,
          incentives,
          {
            type: 'opportunity-cost',
            opportunityCostDetails: {
              hysaRate: homeEnergyData.hysaRate || 4.5,
            },
          }
        );

        return (
          <div key={system.id} className="card bg-base-200 shadow-lg">
            <div className="card-body space-y-4">
              <h3 className="text-2xl font-semibold text-primary">
                {system.name} - Detailed Analysis
              </h3>
              {/* Financing Options - All Three Scenarios */}
              <div className="card bg-base-300">
                <div className="card-body">
                  <h4 className="card-title text-lg">Financing Comparison</h4>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
                    {/* Cash Purchase */}
                    <div className="card bg-base-100 shadow">
                      <div className="card-body">
                        <h5 className="card-title text-md text-success">Cash Purchase</h5>
                        <div className="space-y-2">
                          <div>
                            <p className="text-xs opacity-70">Upfront Cost</p>
                            <p className="text-lg font-semibold">
                              ${cashAnalysis.totalCostAfterIncentives.toLocaleString()}
                            </p>
                          </div>

                          {/* Monthly Comparison for Cash */}
                          <div className="bg-success/10 p-3 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-success">Monthly Comparison:</p>
                            <div className="flex justify-between">
                              <span className="text-xs">Current Electric Bill:</span>
                              <span className="font-semibold">
                                ${((homeEnergyData.yearlyUsageKwh * homeEnergyData.electricityRate) / 12 + homeEnergyData.monthlyFixedCosts).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">New Bill w/ Solar:</span>
                              <span className="font-semibold text-success">
                                ${(() => {
                                  const monthlyProduction = system.specifications.annualProductionKwh / 12;
                                  const monthlyUsage = homeEnergyData.yearlyUsageKwh / 12;
                                  const offsetKwh = Math.min(monthlyProduction, monthlyUsage);
                                  const remainingUsage = Math.max(0, monthlyUsage - offsetKwh);
                                  const newBill = remainingUsage * homeEnergyData.electricityRate + homeEnergyData.monthlyFixedCosts;
                                  return newBill.toFixed(2);
                                })()}
                              </span>
                            </div>
                            <div className="divider my-1"></div>
                            <div className="text-xs text-center font-semibold text-success">
                              {(() => {
                                const currentBill = (homeEnergyData.yearlyUsageKwh * homeEnergyData.electricityRate) / 12 + homeEnergyData.monthlyFixedCosts;
                                const monthlyProduction = system.specifications.annualProductionKwh / 12;
                                const monthlyUsage = homeEnergyData.yearlyUsageKwh / 12;
                                const offsetKwh = Math.min(monthlyProduction, monthlyUsage);
                                const remainingUsage = Math.max(0, monthlyUsage - offsetKwh);
                                const newBill = remainingUsage * homeEnergyData.electricityRate + homeEnergyData.monthlyFixedCosts;
                                const savings = currentBill - newBill;
                                return `✓ Save $${savings.toFixed(2)}/month immediately`;
                              })()}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs opacity-70">Simple Payback</p>
                            <p className="text-lg font-semibold">
                              {cashAnalysis.simplePaybackYears === Infinity
                                ? 'Never'
                                : `${cashAnalysis.simplePaybackYears.toFixed(1)} years`}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">{timeHorizonYears}-Year Net Savings</p>
                            <p
                              className={`text-lg font-semibold ${
                                (() => {
                                  const netSavings = calculateNetSavings(
                                    homeEnergyData,
                                    system,
                                    cashAnalysis.totalCostAfterIncentives,
                                    { type: 'cash' },
                                    timeHorizonYears
                                  );
                                  return netSavings > 0 ? 'text-success' : 'text-error';
                                })()
                              }`}
                            >
                              ${(() => {
                                const netSavings = calculateNetSavings(
                                  homeEnergyData,
                                  system,
                                  cashAnalysis.totalCostAfterIncentives,
                                  { type: 'cash' },
                                  timeHorizonYears
                                );
                                return netSavings.toLocaleString();
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">ROI ({timeHorizonYears} years)</p>
                            <p
                              className={`text-lg font-semibold ${
                                (() => {
                                  const netSavings = calculateNetSavings(
                                    homeEnergyData,
                                    system,
                                    cashAnalysis.totalCostAfterIncentives,
                                    { type: 'cash' },
                                    timeHorizonYears
                                  );
                                  const roi = calculateROI(netSavings, cashAnalysis.totalCostAfterIncentives);
                                  return roi > 0 ? 'text-success' : 'text-error';
                                })()
                              }`}
                            >
                              {(() => {
                                const netSavings = calculateNetSavings(
                                  homeEnergyData,
                                  system,
                                  cashAnalysis.totalCostAfterIncentives,
                                  { type: 'cash' },
                                  timeHorizonYears
                                );
                                const roi = calculateROI(netSavings, cashAnalysis.totalCostAfterIncentives);
                                return roi.toFixed(1);
                              })()}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loan Financing */}
                    <div className="card bg-base-100 shadow">
                      <div className="card-body">
                        <h5 className="card-title text-md text-info">Loan Financing</h5>
                        <div className="space-y-2 text-sm">
                          <div>
                            <p className="text-xs opacity-70">Interest Rate: {system.loanInterestRate || 6}% | {system.loanTermYears || 15} years</p>
                            <p className="text-xs opacity-70">
                              Down Payment: {system.downPaymentMode === 'dollar'
                                ? `$${(system.loanDownPaymentDollar || 0).toLocaleString()}`
                                : `${system.loanDownPaymentPercent || 20}%`}
                            </p>
                          </div>

                          {/* Monthly Comparison */}
                          <div className="bg-info/10 p-3 rounded-lg space-y-2">
                            <p className="text-xs font-semibold text-info">Monthly Comparison:</p>
                            <div className="flex justify-between">
                              <span className="text-xs">Current Electric Bill:</span>
                              <span className="font-semibold">
                                ${((homeEnergyData.yearlyUsageKwh * homeEnergyData.electricityRate) / 12 + homeEnergyData.monthlyFixedCosts).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Estimated Bill w/ Solar:</span>
                              <span className="font-semibold">
                                ${(() => {
                                  const monthlyProduction = system.specifications.annualProductionKwh / 12;
                                  const monthlyUsage = homeEnergyData.yearlyUsageKwh / 12;
                                  const offsetKwh = Math.min(monthlyProduction, monthlyUsage);
                                  const remainingUsage = Math.max(0, monthlyUsage - offsetKwh);
                                  const newBill = remainingUsage * homeEnergyData.electricityRate + homeEnergyData.monthlyFixedCosts;
                                  return newBill.toFixed(2);
                                })()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">+ Loan Payment:</span>
                              <span className="font-semibold">
                                ${loanAnalysis.loanMonthlyPayment?.toFixed(2) || 0}
                              </span>
                            </div>
                            <div className="divider my-1"></div>
                            <div className="flex justify-between">
                              <span className="text-xs font-semibold">Total Monthly Cost:</span>
                              <span className={`font-bold ${
                                (() => {
                                  const currentBill = (homeEnergyData.yearlyUsageKwh * homeEnergyData.electricityRate) / 12 + homeEnergyData.monthlyFixedCosts;
                                  const monthlyProduction = system.specifications.annualProductionKwh / 12;
                                  const monthlyUsage = homeEnergyData.yearlyUsageKwh / 12;
                                  const offsetKwh = Math.min(monthlyProduction, monthlyUsage);
                                  const remainingUsage = Math.max(0, monthlyUsage - offsetKwh);
                                  const newBill = remainingUsage * homeEnergyData.electricityRate + homeEnergyData.monthlyFixedCosts;
                                  const totalWithLoan = newBill + (loanAnalysis.loanMonthlyPayment || 0);
                                  return totalWithLoan < currentBill ? 'text-success' : 'text-error';
                                })()
                              }`}>
                                ${(() => {
                                  const monthlyProduction = system.specifications.annualProductionKwh / 12;
                                  const monthlyUsage = homeEnergyData.yearlyUsageKwh / 12;
                                  const offsetKwh = Math.min(monthlyProduction, monthlyUsage);
                                  const remainingUsage = Math.max(0, monthlyUsage - offsetKwh);
                                  const newBill = remainingUsage * homeEnergyData.electricityRate + homeEnergyData.monthlyFixedCosts;
                                  const totalWithLoan = newBill + (loanAnalysis.loanMonthlyPayment || 0);
                                  return totalWithLoan.toFixed(2);
                                })()}
                              </span>
                            </div>
                            <div className="text-xs text-center">
                              {(() => {
                                const currentBill = (homeEnergyData.yearlyUsageKwh * homeEnergyData.electricityRate) / 12 + homeEnergyData.monthlyFixedCosts;
                                const monthlyProduction = system.specifications.annualProductionKwh / 12;
                                const monthlyUsage = homeEnergyData.yearlyUsageKwh / 12;
                                const offsetKwh = Math.min(monthlyProduction, monthlyUsage);
                                const remainingUsage = Math.max(0, monthlyUsage - offsetKwh);
                                const newBill = remainingUsage * homeEnergyData.electricityRate + homeEnergyData.monthlyFixedCosts;
                                const totalWithLoan = newBill + (loanAnalysis.loanMonthlyPayment || 0);
                                const diff = currentBill - totalWithLoan;
                                if (diff > 0) {
                                  return `✓ Save $${diff.toFixed(2)}/month during loan`;
                                } else {
                                  return `⚠ Pay $${Math.abs(diff).toFixed(2)}/month more during loan`;
                                }
                              })()}
                            </div>
                          </div>

                          <div>
                            <p className="text-xs opacity-70">Monthly Payment</p>
                            <p className="text-lg font-semibold">
                              ${loanAnalysis.loanMonthlyPayment?.toFixed(2) || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">Total Interest Paid</p>
                            <p className="text-md font-semibold">
                              ${loanAnalysis.loanTotalInterest?.toLocaleString() || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">Payback Period (with loan)</p>
                            <p className="text-lg font-semibold">
                              {(() => {
                                const downPayment = getDownPaymentAmount(system, loanAnalysis.totalCostAfterIncentives);
                                const monthlyPayment =
                                  loanAnalysis.loanMonthlyPayment || 0;
                                const payback = calculateLoanPayback(
                                  homeEnergyData,
                                  system,
                                  downPayment,
                                  monthlyPayment,
                                  system.loanTermYears || 15
                                );
                                return payback === Infinity
                                  ? 'Never'
                                  : `${payback.toFixed(1)} years`;
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">{timeHorizonYears}-Year Net Savings</p>
                            <p
                              className={`text-lg font-semibold ${
                                (() => {
                                  const netSavings = calculateNetSavings(
                                    homeEnergyData,
                                    system,
                                    loanAnalysis.totalCostAfterIncentives,
                                    {
                                      type: 'loan',
                                      loanDetails: {
                                        interestRate: system.loanInterestRate || 6,
                                        termYears: system.loanTermYears || 15,
                                        downPaymentPercent: getDownPaymentPercent(system, loanAnalysis.totalCostAfterIncentives),
                                      },
                                    },
                                    timeHorizonYears
                                  );
                                  return netSavings > 0 ? 'text-success' : 'text-error';
                                })()
                              }`}
                            >
                              ${(() => {
                                const netSavings = calculateNetSavings(
                                  homeEnergyData,
                                  system,
                                  loanAnalysis.totalCostAfterIncentives,
                                  {
                                    type: 'loan',
                                    loanDetails: {
                                      interestRate: 6,
                                      termYears: 15,
                                      downPaymentPercent: 20,
                                    },
                                  },
                                  timeHorizonYears
                                );
                                return netSavings.toLocaleString();
                              })()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs opacity-70">ROI ({timeHorizonYears} years)</p>
                            <p
                              className={`text-lg font-semibold ${
                                (() => {
                                  const netSavings = calculateNetSavings(
                                    homeEnergyData,
                                    system,
                                    loanAnalysis.totalCostAfterIncentives,
                                    {
                                      type: 'loan',
                                      loanDetails: {
                                        interestRate: system.loanInterestRate || 6,
                                        termYears: system.loanTermYears || 15,
                                        downPaymentPercent: getDownPaymentPercent(system, loanAnalysis.totalCostAfterIncentives),
                                      },
                                    },
                                    timeHorizonYears
                                  );
                                  const roi = calculateROI(netSavings, loanAnalysis.totalCostAfterIncentives);
                                  return roi > 0 ? 'text-success' : 'text-error';
                                })()
                              }`}
                            >
                              {(() => {
                                const netSavings = calculateNetSavings(
                                  homeEnergyData,
                                  system,
                                  loanAnalysis.totalCostAfterIncentives,
                                  {
                                    type: 'loan',
                                    loanDetails: {
                                      interestRate: 6,
                                      termYears: 15,
                                      downPaymentPercent: 20,
                                    },
                                  },
                                  timeHorizonYears
                                );
                                const roi = calculateROI(netSavings, loanAnalysis.totalCostAfterIncentives);
                                return roi.toFixed(1);
                              })()}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Opportunity Cost */}
                    <div className="card bg-base-100 shadow">
                      <div className="card-body">
                        <h5 className="card-title text-md text-warning">
                          Opportunity Cost (HYSA {homeEnergyData.hysaRate || 4.5}%)
                        </h5>
                        <div className="space-y-2">
                          {(() => {
                            const oppCost = calculateOpportunityCost(
                              opportunityAnalysis.totalCostAfterIncentives,
                              opportunityAnalysis.annualSavingsYear1,
                              homeEnergyData.hysaRate || 4.5,
                              timeHorizonYears
                            );
                            return (
                              <>
                                <div>
                                  <p className="text-xs opacity-70">Solar Net Benefit ({timeHorizonYears}yr)</p>
                                  <p className="text-md font-semibold">
                                    ${oppCost.solarNetBenefit.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs opacity-70">HYSA Net Benefit ({timeHorizonYears}yr)</p>
                                  <p className="text-md font-semibold">
                                    ${oppCost.hysaNetBenefit.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs opacity-70">Difference</p>
                                  <p
                                    className={`text-lg font-semibold ${
                                      oppCost.difference > 0
                                        ? 'text-success'
                                        : 'text-error'
                                    }`}
                                  >
                                    ${oppCost.difference.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold">
                                    {oppCost.difference > 0
                                      ? '✓ Solar is better investment'
                                      : '✗ HYSA is better investment'}
                                  </p>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Production & Consumption */}
              <div className="card bg-base-300">
                <div className="card-body">
                  <h4 className="card-title text-lg">Production & Consumption</h4>
                  <div className="stats stats-vertical sm:stats-horizontal shadow">
                    <div className="stat">
                      <div className="stat-title">Annual Production</div>
                      <div className="stat-value text-xl">
                        {pc.annualProduction.toLocaleString()} kWh
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Annual Consumption</div>
                      <div className="stat-value text-xl">
                        {pc.annualConsumption.toLocaleString()} kWh
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Self-Sufficiency</div>
                      <div className="stat-value text-xl text-success">
                        {pc.selfSufficiencyPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm opacity-70">Excess Generation (to grid)</p>
                      <p className="text-xl font-semibold">
                        {pc.excessGeneration.toLocaleString()} kWh
                      </p>
                    </div>
                    <div>
                      <p className="text-sm opacity-70">Grid Purchases Needed</p>
                      <p className="text-xl font-semibold">
                        {pc.gridPurchasesNeeded.toLocaleString()} kWh
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Configuration Analysis */}
              <div className="card bg-base-300">
                <div className="card-body">
                  <h4 className="card-title text-lg">System Configuration Analysis</h4>
                  <p className="text-sm opacity-70 mb-4">
                    Compare different configuration scenarios for this system
                  </p>

                  <div className="overflow-x-auto">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>Configuration</th>
                          <th>Has Battery</th>
                          <th>Grid-Tied</th>
                          <th>Excess Energy</th>
                          <th>Est. Value Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Current Configuration */}
                        <tr className="bg-primary/10">
                          <td className="font-semibold">Current Setup</td>
                          <td>{system.specifications.battery ? '✓ Yes' : '✗ No'}</td>
                          <td>{system.specifications.gridInteraction.netMeteringEnabled ? '✓ Yes' : '✗ No'}</td>
                          <td>
                            {system.specifications.gridInteraction.netMeteringEnabled
                              ? `Sold back (${pc.excessGeneration.toLocaleString()} kWh)`
                              : system.specifications.battery
                              ? 'Stored in battery'
                              : `Wasted (${pc.excessGeneration.toLocaleString()} kWh)`}
                          </td>
                          <td className="font-semibold">-</td>
                        </tr>

                        {/* Without Battery (if has battery) */}
                        {system.specifications.battery && (() => {
                          const offGridEstimate = estimateOffGridWaste(pc.annualProduction, pc.annualConsumption);
                          return (
                            <tr>
                              <td>Without Battery</td>
                              <td>✗ No</td>
                              <td>{system.specifications.gridInteraction.netMeteringEnabled ? '✓ Yes' : '✗ No'}</td>
                              <td>
                                {system.specifications.gridInteraction.netMeteringEnabled
                                  ? `Sold back (${pc.excessGeneration.toLocaleString()} kWh)`
                                  : (
                                    <>
                                      Wasted (~{offGridEstimate.wastedKwh.toLocaleString()} kWh)
                                      <br />
                                      <span className="text-xs opacity-70">
                                        Only {offGridEstimate.usableKwh.toLocaleString()} kWh usable during daylight
                                      </span>
                                    </>
                                  )}
                              </td>
                              <td>
                                {system.specifications.gridInteraction.netMeteringEnabled
                                  ? <span className="text-warning">Similar savings, less autonomy</span>
                                  : (
                                    <>
                                      <span className="text-error">
                                        -${(offGridEstimate.wastedKwh * homeEnergyData.electricityRate).toLocaleString()}/yr wasted
                                      </span>
                                      <br />
                                      <span className="text-error text-xs">
                                        Need ${(offGridEstimate.mustPurchaseKwh * homeEnergyData.electricityRate).toLocaleString()}/yr for nighttime power
                                      </span>
                                    </>
                                  )}
                              </td>
                            </tr>
                          );
                        })()}

                        {/* Without Grid-Tie (if grid-tied) */}
                        {system.specifications.gridInteraction.netMeteringEnabled && (() => {
                          const offGridEstimate = estimateOffGridWaste(pc.annualProduction, pc.annualConsumption);
                          return (
                            <tr>
                              <td>Off-Grid (No Grid-Tie)</td>
                              <td>{system.specifications.battery ? '✓ Yes' : '✗ No'}</td>
                              <td>✗ No</td>
                              <td>
                                {system.specifications.battery
                                  ? 'Stored or wasted'
                                  : (
                                    <>
                                      Wasted (~{offGridEstimate.wastedKwh.toLocaleString()} kWh)
                                      <br />
                                      <span className="text-xs opacity-70">
                                        Can only use {offGridEstimate.usableKwh.toLocaleString()} kWh during generation
                                      </span>
                                    </>
                                  )}
                              </td>
                              <td>
                                <span className="text-error">
                                  -${(pc.excessGeneration * system.specifications.gridInteraction.gridFeedRate).toLocaleString()}/yr (no buyback revenue)
                                </span>
                                {!system.specifications.battery && (
                                  <>
                                    <br />
                                    <span className="text-error text-xs">
                                      -${(offGridEstimate.wastedKwh * homeEnergyData.electricityRate).toLocaleString()}/yr wasted production
                                    </span>
                                    <br />
                                    <span className="text-error text-xs">
                                      Need generator/grid for {offGridEstimate.mustPurchaseKwh.toLocaleString()} kWh nighttime use
                                    </span>
                                  </>
                                )}
                                {system.specifications.battery && pc.gridPurchasesNeeded > 0 && (
                                  <>
                                    <br />
                                    <span className="text-warning text-xs">
                                      Battery may not cover all nighttime needs ({pc.gridPurchasesNeeded.toLocaleString()} kWh shortfall)
                                    </span>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })()}

                        {/* With Battery (if doesn't have battery) */}
                        {!system.specifications.battery && (
                          <tr>
                            <td>Add Battery Storage</td>
                            <td>✓ Yes</td>
                            <td>{system.specifications.gridInteraction.netMeteringEnabled ? '✓ Yes' : '✗ No'}</td>
                            <td>Stored for later use</td>
                            <td>
                              <span className="text-success">
                                +Backup power, better self-consumption
                              </span>
                              <br />
                              <span className="text-xs opacity-70">
                                Cost: ~$10-15k for typical battery
                              </span>
                            </td>
                          </tr>
                        )}

                        {/* With Grid-Tie (if off-grid) */}
                        {!system.specifications.gridInteraction.netMeteringEnabled && (
                          <tr>
                            <td>Add Grid-Tie</td>
                            <td>{system.specifications.battery ? '✓ Yes' : '✗ No'}</td>
                            <td>✓ Yes</td>
                            <td>Sold back to grid</td>
                            <td>
                              <span className="text-success">
                                +${(pc.excessGeneration * 0.08).toLocaleString()}/yr (est. buyback @ $0.08/kWh)
                              </span>
                              <br />
                              <span className="text-xs opacity-70">
                                Requires utility approval & equipment
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Key Insights */}
                  {(() => {
                    const offGridEstimate = estimateOffGridWaste(pc.annualProduction, pc.annualConsumption);
                    return (
                      <div className="mt-4 p-4 bg-info/10 rounded-lg">
                        <p className="font-semibold text-sm mb-2">💡 Key Insights:</p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          {!system.specifications.battery && !system.specifications.gridInteraction.netMeteringEnabled && (
                            <li className="text-error">
                              <strong>Critical:</strong> Without battery or grid-tie, you can only use ~{offGridEstimate.usableKwh.toLocaleString()} kWh ({((offGridEstimate.usableKwh / pc.annualProduction) * 100).toFixed(0)}% of production) during daylight hours.
                              The remaining ~{offGridEstimate.wastedKwh.toLocaleString()} kWh is wasted, and you'd still need ${(offGridEstimate.mustPurchaseKwh * homeEnergyData.electricityRate).toLocaleString()}/yr for nighttime power.
                            </li>
                          )}
                          {!system.specifications.battery && pc.excessGeneration > 0 && system.specifications.gridInteraction.netMeteringEnabled && (
                            <li>
                              You're generating {pc.excessGeneration.toLocaleString()} kWh excess annually, which is sold back to the grid for ${(pc.excessGeneration * system.specifications.gridInteraction.gridFeedRate).toLocaleString()}/yr.
                            </li>
                          )}
                          {!system.specifications.battery && !system.specifications.gridInteraction.netMeteringEnabled && (
                            <li className="text-warning">
                              <strong>Recommendation:</strong> Add either a battery (for energy storage) or grid-tie (to sell excess), otherwise this system is economically unfavorable.
                            </li>
                          )}
                          {pc.gridPurchasesNeeded > 0 && system.specifications.gridInteraction.netMeteringEnabled && (
                            <li>
                              You'll still need to purchase {pc.gridPurchasesNeeded.toLocaleString()} kWh/year from the grid (~${(pc.gridPurchasesNeeded * homeEnergyData.electricityRate).toLocaleString()}/yr).
                              {!system.specifications.battery && ' A battery could reduce this during nighttime and cloudy periods.'}
                            </li>
                          )}
                          {system.specifications.battery && system.specifications.gridInteraction.netMeteringEnabled && (
                            <li className="text-success">
                              <strong>Optimal configuration:</strong> Battery provides backup power and time-shifting, while grid-tie monetizes excess production and provides reliability.
                            </li>
                          )}
                          {!system.specifications.gridInteraction.netMeteringEnabled && (
                            <li className="text-warning">
                              ⚠ Off-grid requires oversizing solar panels (typically 150-200% of average use) and large battery banks to handle daily/seasonal variability and consecutive cloudy days.
                            </li>
                          )}
                          {system.specifications.battery && !system.specifications.gridInteraction.netMeteringEnabled && (
                            <li>
                              Battery efficiency: Only ~{(system.specifications.battery.roundTripEfficiency || 90)}% round-trip efficiency means some energy is lost to heat during charge/discharge cycles.
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Grid Interaction Analysis (for grid-tied systems) */}
              {system.specifications.gridInteraction.netMeteringEnabled && (() => {
                const gridAnalysis = estimateGridInteraction(
                  pc.annualProduction,
                  pc.annualConsumption,
                  homeEnergyData.electricityRate,
                  system.specifications.gridInteraction.gridFeedRate,
                  true
                );

                return (
                  <div className="card bg-base-300">
                    <div className="card-body">
                      <h4 className="card-title text-lg">Grid Interaction Analysis</h4>
                      <p className="text-sm opacity-70 mb-4">
                        Detailed breakdown of energy bought from and sold to the grid
                      </p>

                      {/* Seasonal Breakdown */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="card bg-base-100">
                          <div className="card-body">
                            <h5 className="card-title text-sm">☀️ Summer (High Production)</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Exported to Grid:</span>
                                <span className="font-semibold text-success">
                                  {gridAnalysis.summer.exported.toLocaleString()} kWh
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Imported from Grid:</span>
                                <span className="font-semibold text-warning">
                                  {gridAnalysis.summer.imported.toLocaleString()} kWh
                                </span>
                              </div>
                              <div className="divider my-1"></div>
                              <div className="flex justify-between">
                                <span className="text-sm font-semibold">Net Cost:</span>
                                <span className="font-bold">
                                  ${gridAnalysis.summer.netCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card bg-base-100">
                          <div className="card-body">
                            <h5 className="card-title text-sm">❄️ Winter (Low Production)</h5>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Exported to Grid:</span>
                                <span className="font-semibold text-success">
                                  {gridAnalysis.winter.exported.toLocaleString()} kWh
                                </span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Imported from Grid:</span>
                                <span className="font-semibold text-warning">
                                  {gridAnalysis.winter.imported.toLocaleString()} kWh
                                </span>
                              </div>
                              <div className="divider my-1"></div>
                              <div className="flex justify-between">
                                <span className="text-sm font-semibold">Net Cost:</span>
                                <span className="font-bold">
                                  ${gridAnalysis.winter.netCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Day/Night Pattern */}
                      <div className="alert alert-info mb-4">
                        <div className="flex flex-col w-full">
                          <p className="font-semibold text-sm mb-2">⏰ Daily Pattern (Typical Day)</p>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs opacity-70">Daytime Excess:</p>
                              <p className="text-lg font-semibold">
                                {gridAnalysis.dayExcess.toFixed(1)} kWh/day
                              </p>
                              <p className="text-xs text-success">→ Sold to grid @ ${system.specifications.gridInteraction.gridFeedRate}/kWh</p>
                            </div>
                            <div>
                              <p className="text-xs opacity-70">Nighttime Deficit:</p>
                              <p className="text-lg font-semibold">
                                {gridAnalysis.nightDeficit.toFixed(1)} kWh/day
                              </p>
                              <p className="text-xs text-warning">→ Bought from grid @ ${homeEnergyData.electricityRate}/kWh</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Annual Summary */}
                      <div className="stats stats-vertical md:stats-horizontal shadow bg-base-100">
                        <div className="stat">
                          <div className="stat-title">Annual Purchases</div>
                          <div className="stat-value text-warning text-xl">
                            {gridAnalysis.annualBuyFromGrid.toLocaleString()} kWh
                          </div>
                          <div className="stat-desc">
                            Cost: ${gridAnalysis.costToBuy.toLocaleString()}
                          </div>
                        </div>

                        <div className="stat">
                          <div className="stat-title">Annual Sales</div>
                          <div className="stat-value text-success text-xl">
                            {gridAnalysis.annualSellToGrid.toLocaleString()} kWh
                          </div>
                          <div className="stat-desc">
                            Revenue: ${gridAnalysis.revenueFromSelling.toLocaleString()}
                          </div>
                        </div>

                        <div className="stat">
                          <div className="stat-title">Net Annual Cost</div>
                          <div className="stat-value text-xl">
                            ${(gridAnalysis.costToBuy - gridAnalysis.revenueFromSelling).toLocaleString()}
                          </div>
                          <div className="stat-desc">After solar offset</div>
                        </div>
                      </div>

                      {/* Rate Difference Analysis */}
                      {homeEnergyData.electricityRate !== system.specifications.gridInteraction.gridFeedRate && (
                        <div className="mt-4 p-4 bg-warning/10 rounded-lg">
                          <p className="font-semibold text-sm mb-2">💡 Buy/Sell Rate Difference Impact:</p>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>You buy power at:</span>
                              <span className="font-semibold">${homeEnergyData.electricityRate}/kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span>You sell power at:</span>
                              <span className="font-semibold">${system.specifications.gridInteraction.gridFeedRate}/kWh</span>
                            </div>
                            <div className="divider my-1"></div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Rate difference:</span>
                              <span className="font-bold text-lg text-error">
                                ${(homeEnergyData.electricityRate - system.specifications.gridInteraction.gridFeedRate).toFixed(3)}/kWh
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="font-semibold">Annual loss from rate difference:</span>
                              <span className="font-bold text-lg text-error">
                                ${gridAnalysis.rateDifferenceImpact.toLocaleString()}
                              </span>
                            </div>
                            {!system.specifications.battery && gridAnalysis.batteryArbitrageValue > 100 && (
                              <>
                                <div className="divider my-1"></div>
                                <div className="bg-success/10 p-3 rounded mt-2">
                                  <p className="font-semibold text-success text-sm mb-1">
                                    🔋 Battery Arbitrage Opportunity:
                                  </p>
                                  <p className="text-xs mb-2">
                                    A battery could save you up to <strong>${gridAnalysis.batteryArbitrageValue.toLocaleString()}/year</strong> by storing daytime excess and using it at night instead of:
                                  </p>
                                  <ul className="text-xs list-disc list-inside space-y-1 ml-2">
                                    <li>Selling excess at ${system.specifications.gridInteraction.gridFeedRate}/kWh during the day</li>
                                    <li>Buying power at ${homeEnergyData.electricityRate}/kWh at night</li>
                                  </ul>
                                  <p className="text-xs mt-2 font-semibold">
                                    ROI depends on battery cost, but this rate arbitrage adds significant value beyond just backup power.
                                  </p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Battery Performance (if applicable) */}
              {bp && (
                <div className="card bg-base-300">
                  <div className="card-body">
                    <h4 className="card-title text-lg">Battery Performance</h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm opacity-70">Full Sun</p>
                        <p className="text-2xl font-semibold text-success">
                          {bp.autonomyDaysSunny === Infinity
                            ? '∞'
                            : bp.autonomyDaysSunny.toFixed(1)}
                        </p>
                        <p className="text-xs">days backup</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">30% Cloudy</p>
                        <p className="text-2xl font-semibold text-warning">
                          {bp.autonomyDaysCloudy30 === Infinity
                            ? '∞'
                            : bp.autonomyDaysCloudy30.toFixed(1)}
                        </p>
                        <p className="text-xs">days backup</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">50% Cloudy</p>
                        <p className="text-2xl font-semibold text-warning">
                          {bp.autonomyDaysCloudy50 === Infinity
                            ? '∞'
                            : bp.autonomyDaysCloudy50.toFixed(1)}
                        </p>
                        <p className="text-xs">days backup</p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">70% Cloudy</p>
                        <p className="text-2xl font-semibold text-error">
                          {bp.autonomyDaysCloudy70 === Infinity
                            ? '∞'
                            : bp.autonomyDaysCloudy70.toFixed(1)}
                        </p>
                        <p className="text-xs">days backup</p>
                      </div>
                    </div>

                    <div className="divider"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm opacity-70">Self-Consumption Rate</p>
                        <p className="text-xl font-semibold text-success">
                          {bp.selfConsumptionRate.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Annual Grid Sales</p>
                        <p className="text-xl font-semibold">
                          {bp.annualGridSales.toLocaleString()} kWh
                        </p>
                      </div>
                      <div>
                        <p className="text-sm opacity-70">Value of Battery Storage</p>
                        <p className="text-xl font-semibold text-success">
                          ${bp.valueOfStoringVsSelling.toFixed(2)}/year
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
