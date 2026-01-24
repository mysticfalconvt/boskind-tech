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
        panelQuantity: 20,
        panelEfficiency: 20,
        locationSunHoursPerDay: 4,
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
        <div className="tabs tabs-boxed bg-base-200 mb-6 overflow-x-auto flex-nowrap">
          <button
            className={`tab ${activeTab === 'home' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home Energy
          </button>

          {data.systems.map((system) => (
            <button
              key={system.id}
              className={`tab ${activeTab === system.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(system.id)}
            >
              {system.name}
            </button>
          ))}

          <button
            className="tab tab-bordered"
            onClick={handleAddSystem}
            title="Add New System"
          >
            + Add System
          </button>

          <button
            className={`tab ${activeTab === 'incentives' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('incentives')}
          >
            Incentives
          </button>

          <button
            className={`tab ${activeTab === 'summary' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('summary')}
            disabled={data.systems.length === 0}
          >
            Summary
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-base-100">
          {activeTab === 'home' && (
            <HomeDataTab
              data={data.homeEnergyData}
              onUpdate={(updated) =>
                setData((prev) => ({ ...prev, homeEnergyData: updated }))
              }
            />
          )}

          {activeTab === 'incentives' && (
            <IncentivesTab
              data={data.incentives}
              onUpdate={(updated) =>
                setData((prev) => ({ ...prev, incentives: updated }))
              }
            />
          )}

          {activeTab === 'summary' && (
            <SummaryTab
              homeEnergyData={data.homeEnergyData}
              systems={data.systems}
              incentives={data.incentives}
            />
          )}

          {data.systems.map(
            (system) =>
              activeTab === system.id && (
                <SystemTab
                  key={system.id}
                  system={system}
                  homeEnergyData={data.homeEnergyData}
                  onUpdate={(updated) => handleUpdateSystem(system.id, updated)}
                  onDuplicate={() => handleDuplicateSystem(system.id)}
                  onDelete={() => handleDeleteSystem(system.id)}
                />
              )
          )}
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
