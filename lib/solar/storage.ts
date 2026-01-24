// localStorage utilities for Solar Calculator

import { SolarCalculatorData } from './types';

const STORAGE_KEY = 'solar-calculator-data';

/**
 * Load solar calculator data from localStorage
 */
export function loadSolarData(): SolarCalculatorData | null {
  if (typeof window === 'undefined') {
    return null; // SSR guard
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }
    return JSON.parse(stored) as SolarCalculatorData;
  } catch (error) {
    console.error('Error loading solar data from localStorage:', error);
    return null;
  }
}

/**
 * Save solar calculator data to localStorage
 */
export function saveSolarData(data: SolarCalculatorData): void {
  if (typeof window === 'undefined') {
    return; // SSR guard
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving solar data to localStorage:', error);
  }
}

/**
 * Export data as JSON file for download
 */
export function exportSolarDataToFile(data: SolarCalculatorData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `solar-plan-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Import data from JSON file
 */
export function importSolarDataFromFile(file: File): Promise<SolarCalculatorData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as SolarCalculatorData;
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file format'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Clear all solar calculator data from localStorage
 */
export function clearSolarData(): void {
  if (typeof window === 'undefined') {
    return; // SSR guard
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing solar data from localStorage:', error);
  }
}

/**
 * Get default/initial solar calculator data
 */
export function getDefaultSolarData(): SolarCalculatorData {
  return {
    homeEnergyData: {
      yearlyUsageKwh: 12000,
      monthlyUsageKwh: 1000,
      electricityRate: 0.13,
      gridBuybackRate: 0.08,
      monthlyFixedCosts: 15,
      energyInflationRate: 3,
    },
    systems: [],
    incentives: {
      federalTaxCreditPercent: 0,
      stateRebate: 0,
      localUtilityIncentives: 0,
      srecValuePerYear: 0,
      applyToAllSystems: true,
    },
  };
}
