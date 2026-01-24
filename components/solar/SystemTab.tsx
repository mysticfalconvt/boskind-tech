import React, { useEffect } from 'react';
import { SolarSystem, HomeEnergyData, BOMLineItem } from '@/lib/solar/types';
import {
  calculateSystemTotalCost,
  calculateSystemSizeKw,
  calculateAnnualProduction,
} from '@/lib/solar/calculations';
import { calculateOptimalBatterySize } from '@/lib/solar/batteryCalculations';

interface SystemTabProps {
  system: SolarSystem;
  homeEnergyData: HomeEnergyData;
  onUpdate: (system: SolarSystem) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export default function SystemTab({
  system,
  homeEnergyData,
  onUpdate,
  onDuplicate,
  onDelete,
}: SystemTabProps) {
  const [simpleMode, setSimpleMode] = React.useState(system.simpleMode || false);
  const [simpleTotalCost, setSimpleTotalCost] = React.useState(
    system.simpleTotalCost || 0
  );
  const [simpleSpecMode, setSimpleSpecMode] = React.useState(
    system.simpleSpecMode || false
  );
  const [simpleSystemSizeKw, setSimpleSystemSizeKw] = React.useState(
    system.simpleSystemSizeKw || calculateSystemSizeKw(system.specifications, system)
  );

  // Financing parameters state (loan terms vary by installer/provider)
  const [loanInterestRate, setLoanInterestRate] = React.useState(system.loanInterestRate || 6);
  const [loanTermYears, setLoanTermYears] = React.useState(system.loanTermYears || 15);
  const [loanDownPaymentPercent, setLoanDownPaymentPercent] = React.useState(system.loanDownPaymentPercent || 20);
  const [loanDownPaymentDollar, setLoanDownPaymentDollar] = React.useState(system.loanDownPaymentDollar || 0);
  const [downPaymentMode, setDownPaymentMode] = React.useState<'percent' | 'dollar'>(system.downPaymentMode || 'percent');

  const totalCost = simpleMode ? simpleTotalCost : calculateSystemTotalCost(system);

  // Persist simple mode state to system
  React.useEffect(() => {
    if (
      system.simpleMode !== simpleMode ||
      system.simpleTotalCost !== simpleTotalCost ||
      system.simpleSpecMode !== simpleSpecMode ||
      system.simpleSystemSizeKw !== simpleSystemSizeKw
    ) {
      onUpdate({
        ...system,
        simpleMode,
        simpleTotalCost,
        simpleSpecMode,
        simpleSystemSizeKw,
      });
    }
  }, [simpleMode, simpleTotalCost, simpleSpecMode, simpleSystemSizeKw]);

  // Persist financing parameters to system
  React.useEffect(() => {
    if (
      system.loanInterestRate !== loanInterestRate ||
      system.loanTermYears !== loanTermYears ||
      system.loanDownPaymentPercent !== loanDownPaymentPercent ||
      system.loanDownPaymentDollar !== loanDownPaymentDollar ||
      system.downPaymentMode !== downPaymentMode
    ) {
      onUpdate({
        ...system,
        loanInterestRate,
        loanTermYears,
        loanDownPaymentPercent,
        loanDownPaymentDollar,
        downPaymentMode,
      });
    }
  }, [loanInterestRate, loanTermYears, loanDownPaymentPercent, loanDownPaymentDollar, downPaymentMode]);

  const systemSizeKw = calculateSystemSizeKw(system.specifications, system);
  const calculatedProduction = calculateAnnualProduction(system.specifications);
  const optimalBatterySize = calculateOptimalBatterySize(homeEnergyData);

  // When simple spec mode changes, update panel quantity to match system size
  const handleSimpleSystemSizeChange = (sizeKw: number) => {
    setSimpleSystemSizeKw(sizeKw);
    // Update panel quantity to match (assuming 400W panels as default)
    const newPanelQuantity = Math.round((sizeKw * 1000) / 400);
    handleSpecChange('panelQuantity', newPanelQuantity);
  };

  // Auto-calculate annual production if not manually overridden or if specs change significantly
  useEffect(() => {
    const currentProduction = system.specifications.annualProductionKwh;

    // Auto-update if:
    // 1. Production is 0 (new system)
    // 2. Calculated production differs by more than 5% (specs were changed)
    const shouldUpdate =
      currentProduction === 0 ||
      (currentProduction > 0 && Math.abs(calculatedProduction - currentProduction) / currentProduction > 0.05);

    if (shouldUpdate && calculatedProduction !== currentProduction) {
      onUpdate({
        ...system,
        specifications: {
          ...system.specifications,
          annualProductionKwh: calculatedProduction,
        },
      });
    }
  }, [
    calculatedProduction,
    system.specifications.panelWattage,
    system.specifications.panelQuantity,
    system.specifications.locationSunHoursPerDay,
    system.specifications.systemEfficiencyFactor,
  ]);

  const handleNameChange = (name: string) => {
    onUpdate({ ...system, name });
  };

  const handleBOMItemChange = (index: number, updated: BOMLineItem) => {
    const newBOM = [...system.bomItems];
    newBOM[index] = updated;
    onUpdate({ ...system, bomItems: newBOM });
  };

  const handleAddBOMItem = () => {
    const newItem: BOMLineItem = {
      id: `bom-${Date.now()}`,
      category: 'Custom Item',
      description: '',
      quantity: 0,
      unitCost: 0,
    };
    onUpdate({ ...system, bomItems: [...system.bomItems, newItem] });
  };

  const handleRemoveBOMItem = (index: number) => {
    const newBOM = system.bomItems.filter((_, i) => i !== index);
    onUpdate({ ...system, bomItems: newBOM });
  };

  const handleSpecChange = (field: string, value: any) => {
    onUpdate({
      ...system,
      specifications: {
        ...system.specifications,
        [field]: value,
      },
    });
  };

  const handleBatteryToggle = () => {
    if (system.specifications.battery) {
      // Remove battery
      onUpdate({
        ...system,
        specifications: {
          ...system.specifications,
          battery: undefined,
        },
      });
    } else {
      // Add battery with defaults
      onUpdate({
        ...system,
        specifications: {
          ...system.specifications,
          battery: {
            capacityKwh: optimalBatterySize,
            usableCapacityPercent: 85,
            roundTripEfficiency: 90,
            dailyUsageTarget: homeEnergyData.yearlyUsageKwh / 365,
          },
        },
      });
    }
  };

  const handleBatteryChange = (field: string, value: number) => {
    if (!system.specifications.battery) return;

    onUpdate({
      ...system,
      specifications: {
        ...system.specifications,
        battery: {
          ...system.specifications.battery,
          [field]: value,
        },
      },
    });
  };

  const handleGridInteractionChange = (field: string, value: any) => {
    onUpdate({
      ...system,
      specifications: {
        ...system.specifications,
        gridInteraction: {
          ...system.specifications.gridInteraction,
          [field]: value,
        },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <label className="label">
                <span className="label-text font-semibold">System Name</span>
              </label>
              <input
                type="text"
                value={system.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input input-bordered w-full max-w-md"
              />
            </div>

            <div className="flex gap-2">
              <button onClick={onDuplicate} className="btn btn-sm btn-outline btn-info">
                Duplicate
              </button>
              <button onClick={onDelete} className="btn btn-sm btn-outline btn-error">
                Delete
              </button>
            </div>
          </div>

          <div className="stats stats-vertical sm:stats-horizontal shadow mt-4 bg-base-300">
            <div className="stat">
              <div className="stat-title">Total Cost</div>
              <div className="stat-value text-2xl">${totalCost.toLocaleString()}</div>
            </div>
            <div className="stat">
              <div className="stat-title">System Size</div>
              <div className="stat-value text-2xl">{systemSizeKw.toFixed(2)} kW</div>
            </div>
            <div className="stat">
              <div className="stat-title">Annual Production</div>
              <div className="stat-value text-2xl">
                {system.specifications.annualProductionKwh.toLocaleString()} kWh
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bill of Materials */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title text-xl text-primary">Bill of Materials</h3>
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Simple Mode (Single Line Item)</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={simpleMode}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSimpleMode(checked);
                    if (checked) {
                      // When switching to simple mode, save current total
                      setSimpleTotalCost(calculateSystemTotalCost(system));
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {simpleMode ? (
            // Simple Mode - Single Input
            <div className="space-y-4">
              <div className="alert alert-info">
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
                  Simple mode is ideal for comparing quoted systems where you only have the
                  total price (not itemized breakdown).
                </span>
              </div>

              <div className="form-control max-w-md">
                <label className="label">
                  <span className="label-text font-semibold text-lg">
                    Total System Cost ($)
                  </span>
                </label>
                <input
                  type="number"
                  value={simpleTotalCost}
                  onChange={(e) => setSimpleTotalCost(Number(e.target.value))}
                  className="input input-bordered input-lg"
                  min="0"
                  step="100"
                  placeholder="Enter total quoted price"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Enter the total price from your installer's quote
                  </span>
                </label>
              </div>
            </div>
          ) : (
            // Detailed Mode - Full BOM Table
            <>
              <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Cost</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {system.bomItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      <input
                        type="text"
                        value={item.category}
                        onChange={(e) =>
                          handleBOMItemChange(index, {
                            ...item,
                            category: e.target.value,
                          })
                        }
                        className="input input-sm input-bordered w-full"
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) =>
                          handleBOMItemChange(index, {
                            ...item,
                            description: e.target.value,
                          })
                        }
                        className="input input-sm input-bordered w-full"
                        placeholder="Details..."
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleBOMItemChange(index, {
                            ...item,
                            quantity: Number(e.target.value),
                          })
                        }
                        className="input input-sm input-bordered w-20"
                        min="0"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleBOMItemChange(index, {
                            ...item,
                            unitCost: Number(e.target.value),
                          })
                        }
                        className="input input-sm input-bordered w-24"
                        min="0"
                        step="0.01"
                      />
                    </td>
                    <td className="font-semibold">
                      ${(item.quantity * item.unitCost).toFixed(2)}
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveBOMItem(index)}
                        className="btn btn-xs btn-ghost btn-error"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={handleAddBOMItem} className="btn btn-sm btn-outline mt-4">
            + Add Custom Item
          </button>
            </>
          )}
        </div>
      </div>

      {/* System Specifications */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="card-title text-xl text-primary">System Specifications</h3>
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Simple Mode (System Size Only)</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={simpleSpecMode}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSimpleSpecMode(checked);
                    if (checked) {
                      // When switching to simple mode, save current system size
                      setSimpleSystemSizeKw(calculateSystemSizeKw(system.specifications, system));
                    }
                  }}
                />
              </label>
            </div>
          </div>

          {simpleSpecMode ? (
            // Simple Mode - Just System Size
            <div className="space-y-4">
              <div className="alert alert-info">
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
                  Simple mode lets you enter just the system size (e.g., "16.5 kW system").
                  Perfect for comparing installer quotes.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold text-lg">
                      System Size (kW)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={simpleSystemSizeKw}
                    onChange={(e) => handleSimpleSystemSizeChange(Number(e.target.value))}
                    className="input input-bordered input-lg"
                    min="0"
                    step="0.1"
                    placeholder="e.g., 16.5"
                  />
                  <label className="label">
                    <span className="label-text-alt">
                      Enter total system size from quote (e.g., 16.5 kW)
                    </span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Sun Hours/Day</span>
                  </label>
                  <input
                    type="number"
                    value={system.specifications.locationSunHoursPerDay}
                    onChange={(e) =>
                      handleSpecChange('locationSunHoursPerDay', Number(e.target.value))
                    }
                    className="input input-bordered"
                    min="0"
                    step="0.1"
                  />
                  <label className="label">
                    <span className="label-text-alt text-info">Peak sun hours for your location</span>
                  </label>
                </div>
              </div>

              <div className="divider"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">System Efficiency (%)</span>
                  </label>
                  <input
                    type="number"
                    value={system.specifications.systemEfficiencyFactor}
                    onChange={(e) =>
                      handleSpecChange('systemEfficiencyFactor', Number(e.target.value))
                    }
                    className="input input-bordered"
                    min="0"
                    max="100"
                    step="1"
                  />
                  <label className="label">
                    <span className="label-text-alt text-info">Default 85%</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Degradation Rate (%/year)</span>
                  </label>
                  <input
                    type="number"
                    value={system.specifications.degradationRate}
                    onChange={(e) =>
                      handleSpecChange('degradationRate', Number(e.target.value))
                    }
                    className="input input-bordered"
                    min="0"
                    max="5"
                    step="0.1"
                  />
                  <label className="label">
                    <span className="label-text-alt text-info">Default 0.5%</span>
                  </label>
                </div>

                <div className="form-control md:col-span-2">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Annual Production (kWh)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={system.specifications.annualProductionKwh}
                    onChange={(e) =>
                      handleSpecChange('annualProductionKwh', Number(e.target.value))
                    }
                    className="input input-bordered"
                    min="0"
                  />
                  <label className="label">
                    <span className="label-text-alt text-info">
                      Calculated: {calculatedProduction.toLocaleString()} kWh (or enter
                      manually)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          ) : (
            // Detailed Mode - All Panel Details
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Panel Wattage (W)</span>
              </label>
              <input
                type="number"
                value={system.specifications.panelWattage}
                onChange={(e) => handleSpecChange('panelWattage', Number(e.target.value))}
                className="input input-bordered"
                min="0"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Panel Quantity</span>
              </label>
              <input
                type="number"
                value={system.specifications.panelQuantity}
                onChange={(e) => handleSpecChange('panelQuantity', Number(e.target.value))}
                className="input input-bordered"
                min="0"
              />
            </div>


            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Sun Hours/Day</span>
              </label>
              <input
                type="number"
                value={system.specifications.locationSunHoursPerDay}
                onChange={(e) =>
                  handleSpecChange('locationSunHoursPerDay', Number(e.target.value))
                }
                className="input input-bordered"
                min="0"
                step="0.1"
              />
              <label className="label">
                <span className="label-text-alt text-info">Peak sun hours</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">System Efficiency (%)</span>
              </label>
              <input
                type="number"
                value={system.specifications.systemEfficiencyFactor}
                onChange={(e) =>
                  handleSpecChange('systemEfficiencyFactor', Number(e.target.value))
                }
                className="input input-bordered"
                min="0"
                max="100"
                step="1"
              />
              <label className="label">
                <span className="label-text-alt text-info">Default 85%</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">Degradation Rate (%/year)</span>
              </label>
              <input
                type="number"
                value={system.specifications.degradationRate}
                onChange={(e) =>
                  handleSpecChange('degradationRate', Number(e.target.value))
                }
                className="input input-bordered"
                min="0"
                max="5"
                step="0.1"
              />
              <label className="label">
                <span className="label-text-alt text-info">Default 0.5%</span>
              </label>
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text font-semibold">
                  Annual Production (kWh)
                </span>
              </label>
              <input
                type="number"
                value={system.specifications.annualProductionKwh}
                onChange={(e) =>
                  handleSpecChange('annualProductionKwh', Number(e.target.value))
                }
                className="input input-bordered"
                min="0"
              />
              <label className="label">
                <span className="label-text-alt text-info">
                  Calculated: {calculatedProduction.toLocaleString()} kWh (or enter
                  manually)
                </span>
              </label>
            </div>
          </div>
          )}
        </div>
      </div>

      {/* Financing Parameters */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">Financing Parameters</h3>
          <p className="text-sm opacity-70 mb-4">
            Configure loan terms specific to this system/installer
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Loan Interest Rate */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Loan Interest Rate (%)</span>
              </label>
              <input
                type="number"
                value={loanInterestRate}
                onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                className="input input-bordered"
                step="0.1"
                min="0"
                max="30"
              />
            </div>

            {/* Loan Term */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">Loan Term (years)</span>
              </label>
              <input
                type="number"
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
                className="input input-bordered"
                step="1"
                min="1"
                max="30"
              />
            </div>

            {/* Down Payment with Toggle */}
            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Down Payment</span>
                <div className="flex items-center gap-2">
                  <span className="label-text-alt">%</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-sm"
                    checked={downPaymentMode === 'dollar'}
                    onChange={(e) => {
                      const newMode = e.target.checked ? 'dollar' : 'percent';
                      const systemCost = totalCost;

                      if (newMode === 'dollar') {
                        // Convert percent to dollar
                        setLoanDownPaymentDollar(Math.round(systemCost * (loanDownPaymentPercent / 100)));
                      } else {
                        // Convert dollar to percent
                        setLoanDownPaymentPercent(
                          systemCost > 0
                            ? Math.round((loanDownPaymentDollar / systemCost) * 100)
                            : 20
                        );
                      }
                      setDownPaymentMode(newMode);
                    }}
                  />
                  <span className="label-text-alt">$</span>
                </div>
              </label>
              {downPaymentMode === 'percent' ? (
                <input
                  type="number"
                  value={loanDownPaymentPercent}
                  onChange={(e) => setLoanDownPaymentPercent(Number(e.target.value))}
                  className="input input-bordered"
                  step="1"
                  min="0"
                  max="100"
                  placeholder="Percentage"
                />
              ) : (
                <input
                  type="number"
                  value={loanDownPaymentDollar}
                  onChange={(e) => setLoanDownPaymentDollar(Number(e.target.value))}
                  className="input input-bordered"
                  step="100"
                  min="0"
                  placeholder="Dollar amount"
                />
              )}
              <label className="label">
                <span className="label-text-alt">
                  {downPaymentMode === 'percent'
                    ? `≈ $${Math.round(totalCost * (loanDownPaymentPercent / 100)).toLocaleString()} based on system cost`
                    : `≈ ${totalCost > 0 ? ((loanDownPaymentDollar / totalCost) * 100).toFixed(1) : 0}% of system cost`}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Battery Configuration */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <div className="flex justify-between items-center">
            <h3 className="card-title text-xl text-primary">Battery Storage</h3>
            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <span className="label-text">Enable Battery</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={!!system.specifications.battery}
                  onChange={handleBatteryToggle}
                />
              </label>
            </div>
          </div>

          {system.specifications.battery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Capacity (kWh)</span>
                </label>
                <input
                  type="number"
                  value={system.specifications.battery.capacityKwh}
                  onChange={(e) =>
                    handleBatteryChange('capacityKwh', Number(e.target.value))
                  }
                  className="input input-bordered"
                  min="0"
                  step="0.1"
                />
                <label className="label">
                  <span className="label-text-alt text-info">
                    Recommended: {optimalBatterySize.toFixed(1)} kWh for 1 day autonomy
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Usable Capacity (%)
                  </span>
                </label>
                <input
                  type="number"
                  value={system.specifications.battery.usableCapacityPercent}
                  onChange={(e) =>
                    handleBatteryChange('usableCapacityPercent', Number(e.target.value))
                  }
                  className="input input-bordered"
                  min="0"
                  max="100"
                  step="1"
                />
                <label className="label">
                  <span className="label-text-alt text-info">
                    Typical 80-90% for lithium
                  </span>
                </label>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Round-Trip Efficiency (%)
                  </span>
                </label>
                <input
                  type="number"
                  value={system.specifications.battery.roundTripEfficiency}
                  onChange={(e) =>
                    handleBatteryChange('roundTripEfficiency', Number(e.target.value))
                  }
                  className="input input-bordered"
                  min="0"
                  max="100"
                  step="1"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">
                    Daily Usage Target (kWh)
                  </span>
                </label>
                <input
                  type="number"
                  value={system.specifications.battery.dailyUsageTarget}
                  onChange={(e) =>
                    handleBatteryChange('dailyUsageTarget', Number(e.target.value))
                  }
                  className="input input-bordered"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid Interaction */}
      <div className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h3 className="card-title text-xl text-primary">Grid Interaction</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={system.specifications.gridInteraction.netMeteringEnabled}
                  onChange={(e) =>
                    handleGridInteractionChange('netMeteringEnabled', e.target.checked)
                  }
                />
                <span className="label-text font-semibold">Net Metering Enabled</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Grid Feed Rate ($/kWh)
                </span>
              </label>
              <input
                type="number"
                value={system.specifications.gridInteraction.gridFeedRate}
                onChange={(e) =>
                  handleGridInteractionChange('gridFeedRate', Number(e.target.value))
                }
                className="input input-bordered"
                min="0"
                step="0.01"
              />
              <label className="label">
                <span className="label-text-alt text-info">What utility pays you</span>
              </label>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold">
                  Grid Purchase Rate ($/kWh)
                </span>
              </label>
              <input
                type="number"
                value={system.specifications.gridInteraction.gridPurchaseRate}
                onChange={(e) =>
                  handleGridInteractionChange('gridPurchaseRate', Number(e.target.value))
                }
                className="input input-bordered"
                min="0"
                step="0.01"
              />
              <label className="label">
                <span className="label-text-alt text-info">What you pay utility</span>
              </label>
            </div>

            {system.specifications.battery && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Battery Priority</span>
                </label>
                <select
                  value={system.specifications.gridInteraction.batteryPriority}
                  onChange={(e) =>
                    handleGridInteractionChange(
                      'batteryPriority',
                      e.target.value as 'self-consumption' | 'grid-export'
                    )
                  }
                  className="select select-bordered"
                >
                  <option value="self-consumption">Self-Consumption First</option>
                  <option value="grid-export">Grid Export First</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
