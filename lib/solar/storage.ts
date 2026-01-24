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
 * Validate that imported data matches expected structure
 */
function validateSolarData(data: unknown): data is SolarCalculatorData {
  try {
    if (!data || typeof data !== 'object') {
      console.error('Validation failed: data is not an object');
      return false;
    }

    const obj = data as Record<string, unknown>;

    // Check for prototype pollution attempts (check own properties only)
    if (
      Object.prototype.hasOwnProperty.call(obj, '__proto__') ||
      Object.prototype.hasOwnProperty.call(obj, 'constructor') ||
      Object.prototype.hasOwnProperty.call(obj, 'prototype')
    ) {
      console.error('Validation failed: prototype pollution attempt detected');
      return false;
    }

    // Validate homeEnergyData exists and has required fields
    if (!obj.homeEnergyData || typeof obj.homeEnergyData !== 'object') {
      console.error('Validation failed: homeEnergyData missing or invalid');
      return false;
    }

    const homeData = obj.homeEnergyData as Record<string, unknown>;
    if (typeof homeData.yearlyUsageKwh !== 'number') {
      console.error('Validation failed: yearlyUsageKwh is not a number');
      return false;
    }
    if (typeof homeData.monthlyUsageKwh !== 'number') {
      console.error('Validation failed: monthlyUsageKwh is not a number');
      return false;
    }
    if (typeof homeData.electricityRate !== 'number') {
      console.error('Validation failed: electricityRate is not a number');
      return false;
    }
    if (typeof homeData.gridBuybackRate !== 'number') {
      console.error('Validation failed: gridBuybackRate is not a number');
      return false;
    }

    // Validate systems is an array
    if (!Array.isArray(obj.systems)) {
      console.error('Validation failed: systems is not an array');
      return false;
    }

    // Validate incentives exists
    if (!obj.incentives || typeof obj.incentives !== 'object') {
      console.error('Validation failed: incentives missing or invalid');
      return false;
    }

    console.log('Validation passed successfully');
    return true;
  } catch (error) {
    console.error('Validation error:', error);
    return false;
  }
}

/**
 * Migrate old data format to new format
 */
function migrateData(data: any): SolarCalculatorData {
  // Migrate hysaRate from systems to homeEnergyData if needed
  if (!data.homeEnergyData.hysaRate && data.systems && data.systems.length > 0) {
    const firstSystemHysaRate = data.systems[0].hysaRate;
    if (typeof firstSystemHysaRate === 'number') {
      data.homeEnergyData.hysaRate = firstSystemHysaRate;
    }
  }

  // Remove hysaRate from systems (old location)
  if (data.systems) {
    data.systems = data.systems.map((system: any) => {
      const { hysaRate, ...rest } = system;
      return rest;
    });
  }

  // Ensure default hysaRate if still missing
  if (!data.homeEnergyData.hysaRate) {
    data.homeEnergyData.hysaRate = 4.5;
  }

  return data as SolarCalculatorData;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: unknown): string {
  if (typeof str !== 'string') {
    return '';
  }
  // Remove any potential script tags or dangerous content
  return str
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Deep sanitize object to remove XSS vectors
 */
function sanitizeObject(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip dangerous properties
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
}

/**
 * Import data from JSON file
 */
export function importSolarDataFromFile(file: File): Promise<SolarCalculatorData> {
  return new Promise((resolve, reject) => {
    // File size limit: 5MB
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    if (file.size > MAX_FILE_SIZE) {
      reject(new Error('File too large. Maximum size is 5MB.'));
      return;
    }

    // Verify file type
    if (!file.type.includes('json') && !file.name.endsWith('.json')) {
      reject(new Error('Invalid file type. Please upload a JSON file.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;

        // Parse JSON
        const parsed = JSON.parse(content);

        // Validate structure
        if (!validateSolarData(parsed)) {
          reject(new Error('Invalid solar calculator data format'));
          return;
        }

        // Migrate old data format to new format
        const migrated = migrateData(parsed);

        // Sanitize to remove any XSS vectors
        const sanitized = sanitizeObject(migrated) as SolarCalculatorData;

        resolve(sanitized);
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new Error('Invalid JSON format'));
        } else {
          reject(new Error('Error processing file'));
        }
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
      yearlyUsageKwh: 15000,
      monthlyUsageKwh: 1250,
      electricityRate: 0.20,
      gridBuybackRate: 0.10,
      monthlyFixedCosts: 20,
      energyInflationRate: 3,
      hysaRate: 4.5,
    },
    systems: [],
    incentives: {
      federalTaxCreditPercent: 30,
      stateRebate: 0,
      localUtilityIncentives: 0,
      srecValuePerYear: 0,
      applyToAllSystems: true,
    },
  };
}
