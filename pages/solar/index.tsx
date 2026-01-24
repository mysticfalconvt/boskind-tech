import React, { useState, useEffect } from 'react';
import { SolarCalculatorData, SolarSystem } from '@/lib/solar/types';
import {
  loadSolarData,
  saveSolarData,
  getDefaultSolarData,
  exportSolarDataToFile,
  importSolarDataFromFile,
  clearSolarData,
} from '@/lib/solar/storage';
import HomeDataTab from '@/components/solar/HomeDataTab';
import SystemTab from '@/components/solar/SystemTab';
import IncentivesTab from '@/components/solar/IncentivesTab';
import SummaryTab from '@/components/solar/SummaryTab';

export default function SolarCalculator() {
  const [data, setData] = useState<SolarCalculatorData>(getDefaultSolarData());
  const [activeTab, setActiveTab] = useState<string>('home');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    const loaded = loadSolarData();
    if (loaded) {
      setData(loaded);
    }
  }, []);

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    saveSolarData(data);
  }, [data]);

  const handleAddSystem = () => {
    const newSystem: SolarSystem = {
      id: `system-${Date.now()}`,
      name: `System ${data.systems.length + 1}`,
      bomItems: [
        {
          id: `bom-${Date.now()}-1`,
          category: 'Solar Panels',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
        {
          id: `bom-${Date.now()}-2`,
          category: 'Inverter(s)',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
        {
          id: `bom-${Date.now()}-3`,
          category: 'Batteries',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
        {
          id: `bom-${Date.now()}-4`,
          category: 'Mounting/Racking',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
        {
          id: `bom-${Date.now()}-5`,
          category: 'Electrical/Wiring',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
        {
          id: `bom-${Date.now()}-6`,
          category: 'Installation Labor',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
        {
          id: `bom-${Date.now()}-7`,
          category: 'Permits/Inspection',
          description: '',
          quantity: 0,
          unitCost: 0,
        },
      ],
      specifications: {
        panelWattage: 400,
        panelQuantity: 25,
        panelEfficiency: 20,
        locationSunHoursPerDay: 4.5,
        systemEfficiencyFactor: 85,
        degradationRate: 0.5,
        annualProductionKwh: 0,
        gridInteraction: {
          netMeteringEnabled: true,
          gridFeedRate: data.homeEnergyData.gridBuybackRate,
          gridPurchaseRate: data.homeEnergyData.electricityRate,
          batteryPriority: 'self-consumption',
        },
      },
      simpleMode: true,
      simpleTotalCost: 25000,
      simpleSpecMode: false,
      loanInterestRate: 6,
      loanTermYears: 15,
      loanDownPaymentPercent: 20,
      loanDownPaymentDollar: 5000,
      downPaymentMode: 'percent',
    };

    setData((prev) => ({
      ...prev,
      systems: [...prev.systems, newSystem],
    }));
    setActiveTab(newSystem.id);
  };

  const handleDuplicateSystem = (systemId: string) => {
    const systemToDuplicate = data.systems.find((s) => s.id === systemId);
    if (!systemToDuplicate) return;

    const newSystem: SolarSystem = {
      ...JSON.parse(JSON.stringify(systemToDuplicate)), // Deep clone
      id: `system-${Date.now()}`,
      name: `${systemToDuplicate.name} (Copy)`,
    };

    setData((prev) => ({
      ...prev,
      systems: [...prev.systems, newSystem],
    }));
    setActiveTab(newSystem.id);
  };

  const handleDeleteSystem = (systemId: string) => {
    setData((prev) => ({
      ...prev,
      systems: prev.systems.filter((s) => s.id !== systemId),
    }));
    setActiveTab('home');
  };

  const handleUpdateSystem = (systemId: string, updatedSystem: SolarSystem) => {
    setData((prev) => ({
      ...prev,
      systems: prev.systems.map((s) => (s.id === systemId ? updatedSystem : s)),
    }));
  };

  const handleExport = () => {
    exportSolarDataToFile(data);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importSolarDataFromFile(file);
      setData(imported);
      setActiveTab('home');
    } catch (error) {
      alert('Error importing file. Please check the file format.');
      console.error(error);
    }
  };

  const handleClear = () => {
    clearSolarData();
    setData(getDefaultSolarData());
    setActiveTab('home');
    setShowClearConfirm(false);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 sm:p-6 lg:p-8 bg-base-100 text-base-content">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-primary">
              Solar Calculator
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              Compare solar systems, analyze costs, and calculate payback periods
            </p>
          </div>

          {/* Data Management Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="btn btn-sm btn-outline btn-primary"
            >
              Export Data
            </button>
            <label className="btn btn-sm btn-outline btn-primary">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="btn btn-sm btn-outline btn-error"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs tabs-lifted w-full">
          <input
            type="radio"
            name="solar_tabs"
            role="tab"
            className="tab text-base font-medium"
            aria-label="Home Energy"
            checked={activeTab === 'home'}
            onChange={() => setActiveTab('home')}
          />
          <div role="tabpanel" className="tab-content bg-base-200 border-base-300 rounded-box p-6">
            <HomeDataTab
              data={data.homeEnergyData}
              onUpdate={(updated) =>
                setData((prev) => ({ ...prev, homeEnergyData: updated }))
              }
            />
          </div>

          {data.systems.map((system) => (
            <React.Fragment key={system.id}>
              <input
                type="radio"
                name="solar_tabs"
                role="tab"
                className="tab text-base font-medium"
                aria-label={system.name}
                checked={activeTab === system.id}
                onChange={() => setActiveTab(system.id)}
              />
              <div role="tabpanel" className="tab-content bg-base-200 border-base-300 rounded-box p-6">
                <SystemTab
                  system={system}
                  homeEnergyData={data.homeEnergyData}
                  onUpdate={(updated) => handleUpdateSystem(system.id, updated)}
                  onDuplicate={() => handleDuplicateSystem(system.id)}
                  onDelete={() => handleDeleteSystem(system.id)}
                />
              </div>
            </React.Fragment>
          ))}

          <button
            className="tab text-base font-medium hover:bg-base-200"
            onClick={handleAddSystem}
            title="Add New System"
          >
            + Add System
          </button>

          <input
            type="radio"
            name="solar_tabs"
            role="tab"
            className="tab text-base font-medium"
            aria-label="Incentives"
            checked={activeTab === 'incentives'}
            onChange={() => setActiveTab('incentives')}
          />
          <div role="tabpanel" className="tab-content bg-base-200 border-base-300 rounded-box p-6">
            <IncentivesTab
              data={data.incentives}
              onUpdate={(updated) =>
                setData((prev) => ({ ...prev, incentives: updated }))
              }
            />
          </div>

          <input
            type="radio"
            name="solar_tabs"
            role="tab"
            className="tab text-base font-medium"
            aria-label="Summary"
            checked={activeTab === 'summary'}
            onChange={() => setActiveTab('summary')}
            disabled={data.systems.length === 0}
          />
          <div role="tabpanel" className="tab-content bg-base-200 border-base-300 rounded-box p-6">
            <SummaryTab
              homeEnergyData={data.homeEnergyData}
              systems={data.systems}
              incentives={data.incentives}
            />
          </div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Clear All Data?</h3>
            <p className="py-4">
              This will permanently delete all your solar calculator data. This action
              cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn btn-error"
                onClick={handleClear}
              >
                Clear Everything
              </button>
              <button
                className="btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
