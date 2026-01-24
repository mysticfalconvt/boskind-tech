// Battery-specific calculation utilities

import {
  BatteryConfig,
  SolarSystem,
  HomeEnergyData,
  BatteryPerformance,
} from './types';

/**
 * Calculate usable battery capacity
 */
export function calculateUsableBatteryCapacity(
  battery: BatteryConfig
): number {
  return (battery.capacityKwh * battery.usableCapacityPercent) / 100;
}

/**
 * Calculate battery autonomy days (full sun)
 */
export function calculateAutonomyDays(
  battery: BatteryConfig,
  dailyUsage: number
): number {
  const usableCapacity = calculateUsableBatteryCapacity(battery);
  if (dailyUsage === 0) {
    return Infinity;
  }
  return usableCapacity / dailyUsage;
}

/**
 * Calculate battery autonomy with reduced solar production (cloudy/snowy)
 */
export function calculateAutonomyWithReducedProduction(
  battery: BatteryConfig,
  dailyUsage: number,
  dailyProduction: number,
  productionReductionPercent: number
): number {
  const usableCapacity = calculateUsableBatteryCapacity(battery);
  const reducedProduction = dailyProduction * (productionReductionPercent / 100);
  const netDailyDeficit = dailyUsage - reducedProduction;

  if (netDailyDeficit <= 0) {
    return Infinity; // Production still meets or exceeds usage
  }

  return usableCapacity / netDailyDeficit;
}

/**
 * Calculate annual grid purchases and sales with battery
 */
export function calculateGridInteractionWithBattery(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem
): {
  annualGridPurchases: number;
  annualGridSales: number;
} {
  if (!system.specifications.battery) {
    // No battery - simple calculation
    const annualProduction = system.specifications.annualProductionKwh;
    const annualConsumption = homeEnergyData.yearlyUsageKwh;

    return {
      annualGridPurchases: Math.max(0, annualConsumption - annualProduction),
      annualGridSales: Math.max(0, annualProduction - annualConsumption),
    };
  }

  const battery = system.specifications.battery;
  const annualProduction = system.specifications.annualProductionKwh;
  const annualConsumption = homeEnergyData.yearlyUsageKwh;
  const dailyProduction = annualProduction / 365;
  const dailyConsumption = annualConsumption / 365;
  const usableCapacity = calculateUsableBatteryCapacity(battery);

  // Simplified daily simulation (assumes even distribution)
  let totalGridPurchases = 0;
  let totalGridSales = 0;

  // Simulate average day
  const dailyExcess = Math.max(0, dailyProduction - dailyConsumption);
  const dailyDeficit = Math.max(0, dailyConsumption - dailyProduction);

  if (dailyExcess > 0) {
    // Surplus day - charge battery first, then export
    const batteryCharge = Math.min(dailyExcess, usableCapacity);
    const gridExport = dailyExcess - batteryCharge;
    totalGridSales = gridExport * 365;
  } else if (dailyDeficit > 0) {
    // Deficit day - use battery first, then grid
    const batteryDischarge = Math.min(dailyDeficit, usableCapacity);
    const gridImport = dailyDeficit - batteryDischarge;
    totalGridPurchases = gridImport * 365;
  }

  return {
    annualGridPurchases: totalGridPurchases,
    annualGridSales: totalGridSales,
  };
}

/**
 * Calculate self-consumption rate (percentage of solar production used on-site)
 */
export function calculateSelfConsumptionRate(
  annualProduction: number,
  annualGridSales: number
): number {
  if (annualProduction === 0) {
    return 0;
  }
  const selfConsumed = annualProduction - annualGridSales;
  return (selfConsumed / annualProduction) * 100;
}

/**
 * Calculate value of storing vs selling to grid
 */
export function calculateValueOfStoring(
  system: SolarSystem,
  homeEnergyData: HomeEnergyData
): number {
  if (!system.specifications.battery) {
    return 0;
  }

  const gridPurchaseRate = system.specifications.gridInteraction.gridPurchaseRate;
  const gridFeedRate = system.specifications.gridInteraction.gridFeedRate;

  // Calculate grid interaction with and without battery
  const withBattery = calculateGridInteractionWithBattery(
    homeEnergyData,
    system
  );

  // Simulate without battery (create a temp system)
  const systemNoBattery = {
    ...system,
    specifications: {
      ...system.specifications,
      battery: undefined,
    },
  };

  const withoutBattery = calculateGridInteractionWithBattery(
    homeEnergyData,
    systemNoBattery
  );

  // Calculate cost difference
  const costWithBattery =
    withBattery.annualGridPurchases * gridPurchaseRate -
    withBattery.annualGridSales * gridFeedRate;

  const costWithoutBattery =
    withoutBattery.annualGridPurchases * gridPurchaseRate -
    withoutBattery.annualGridSales * gridFeedRate;

  // Value of storing is the savings (negative cost difference)
  return costWithoutBattery - costWithBattery;
}

/**
 * Calculate complete battery performance metrics
 */
export function calculateBatteryPerformance(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem
): BatteryPerformance | null {
  if (!system.specifications.battery) {
    return null;
  }

  const battery = system.specifications.battery;
  const dailyUsage = homeEnergyData.yearlyUsageKwh / 365;
  const dailyProduction = system.specifications.annualProductionKwh / 365;

  const autonomyDaysSunny = calculateAutonomyDays(battery, dailyUsage);
  const autonomyDaysCloudy30 = calculateAutonomyWithReducedProduction(
    battery,
    dailyUsage,
    dailyProduction,
    30
  );
  const autonomyDaysCloudy50 = calculateAutonomyWithReducedProduction(
    battery,
    dailyUsage,
    dailyProduction,
    50
  );
  const autonomyDaysCloudy70 = calculateAutonomyWithReducedProduction(
    battery,
    dailyUsage,
    dailyProduction,
    70
  );

  const { annualGridPurchases, annualGridSales } =
    calculateGridInteractionWithBattery(homeEnergyData, system);

  const selfConsumptionRate = calculateSelfConsumptionRate(
    system.specifications.annualProductionKwh,
    annualGridSales
  );

  const valueOfStoringVsSelling = calculateValueOfStoring(
    system,
    homeEnergyData
  );

  return {
    autonomyDaysSunny,
    autonomyDaysCloudy30,
    autonomyDaysCloudy50,
    autonomyDaysCloudy70,
    annualGridPurchases,
    annualGridSales,
    selfConsumptionRate,
    valueOfStoringVsSelling,
  };
}

/**
 * Calculate optimal battery size based on daily usage patterns
 */
export function calculateOptimalBatterySize(
  homeEnergyData: HomeEnergyData,
  targetAutonomyDays: number = 1
): number {
  const dailyUsage = homeEnergyData.yearlyUsageKwh / 365;
  // Assume 85% usable capacity
  const optimalCapacity = (dailyUsage * targetAutonomyDays) / 0.85;
  return Math.round(optimalCapacity * 10) / 10; // Round to 1 decimal
}
