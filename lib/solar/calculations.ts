// Calculation utilities for Solar Calculator

import {
  HomeEnergyData,
  SolarSystem,
  SystemSpecifications,
  Incentives,
  FinancingOption,
  SystemFinancialAnalysis,
  BatteryPerformance,
  ProductionConsumption,
} from './types';

/**
 * Calculate yearly energy cost from home energy data
 */
export function calculateYearlyEnergyCost(data: HomeEnergyData): number {
  const yearlyEnergyCost = data.yearlyUsageKwh * data.electricityRate;
  const yearlyFixedCosts = data.monthlyFixedCosts * 12;
  return yearlyEnergyCost + yearlyFixedCosts;
}

/**
 * Calculate monthly average usage/cost
 */
export function calculateMonthlyAverages(data: HomeEnergyData) {
  return {
    avgMonthlyKwh: data.yearlyUsageKwh / 12,
    avgMonthlyCost: calculateYearlyEnergyCost(data) / 12,
  };
}

/**
 * Calculate daily average usage/cost
 */
export function calculateDailyAverages(data: HomeEnergyData) {
  const yearlyTotal = calculateYearlyEnergyCost(data);
  return {
    avgDailyKwh: data.yearlyUsageKwh / 365,
    avgDailyCost: yearlyTotal / 365,
  };
}

/**
 * Calculate total system cost from BOM items or simple mode cost
 */
export function calculateSystemTotalCost(system: SolarSystem): number {
  // If in simple mode, use the simple total cost
  if (system.simpleMode && system.simpleTotalCost) {
    return system.simpleTotalCost;
  }

  // Otherwise, sum up BOM items
  return system.bomItems.reduce((total, item) => {
    return total + item.quantity * item.unitCost;
  }, 0);
}

/**
 * Calculate total system size in kW from panel specs or simple mode
 */
export function calculateSystemSizeKw(
  specs: SystemSpecifications,
  system?: SolarSystem
): number {
  // If simple spec mode is enabled, use the simple system size
  if (system?.simpleSpecMode && system.simpleSystemSizeKw) {
    return system.simpleSystemSizeKw;
  }

  // Otherwise, calculate from panel specs
  return (specs.panelWattage * specs.panelQuantity) / 1000;
}

/**
 * Calculate annual production estimate
 * Formula: System Size (kW) × Annual Sun Hours × System Efficiency Factor
 * Note: Panel efficiency is already in the panel wattage rating, so we don't multiply by it again
 */
export function calculateAnnualProduction(specs: SystemSpecifications): number {
  const systemSizeKw = calculateSystemSizeKw(specs);
  const annualSunHours = specs.locationSunHoursPerDay * 365;
  const production =
    systemSizeKw *
    annualSunHours *
    (specs.systemEfficiencyFactor / 100);
  return Math.round(production);
}

/**
 * Calculate production with degradation over years
 */
export function calculateProductionWithDegradation(
  baseProduction: number,
  year: number,
  degradationRate: number
): number {
  const degradationFactor = Math.pow(1 - degradationRate / 100, year - 1);
  return baseProduction * degradationFactor;
}

/**
 * Calculate system cost after incentives
 */
export function calculateCostAfterIncentives(
  baseCost: number,
  incentives: Incentives
): number {
  const federalCredit = baseCost * (incentives.federalTaxCreditPercent / 100);
  const totalIncentives =
    federalCredit +
    incentives.stateRebate +
    incentives.localUtilityIncentives;
  return Math.max(0, baseCost - totalIncentives);
}

/**
 * Calculate loan monthly payment
 */
export function calculateLoanMonthlyPayment(
  principal: number,
  annualInterestRate: number,
  termYears: number
): number {
  const monthlyRate = annualInterestRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return payment;
}

/**
 * Calculate total loan interest paid
 */
export function calculateLoanTotalInterest(
  principal: number,
  annualInterestRate: number,
  termYears: number
): number {
  const monthlyPayment = calculateLoanMonthlyPayment(
    principal,
    annualInterestRate,
    termYears
  );
  const totalPaid = monthlyPayment * termYears * 12;
  return totalPaid - principal;
}

/**
 * Calculate annual savings in a given year
 */
export function calculateAnnualSavings(
  homeEnergyData: HomeEnergyData,
  annualProduction: number,
  year: number,
  gridBuybackRate: number,
  hasNetMetering: boolean
): number {
  // Apply energy inflation to electricity rate
  const inflatedRate =
    homeEnergyData.electricityRate *
    Math.pow(1 + homeEnergyData.energyInflationRate / 100, year - 1);

  const annualConsumption = homeEnergyData.yearlyUsageKwh;
  const excessProduction = Math.max(0, annualProduction - annualConsumption);
  const offsetProduction = Math.min(annualProduction, annualConsumption);

  // Savings from offset consumption
  const offsetSavings = offsetProduction * inflatedRate;

  // Credit from excess production (if net metering)
  const excessCredit = hasNetMetering ? excessProduction * gridBuybackRate : 0;

  return offsetSavings + excessCredit;
}

/**
 * Calculate simple payback period in years
 */
export function calculateSimplePayback(
  systemCost: number,
  annualSavingsYear1: number
): number {
  if (annualSavingsYear1 <= 0) {
    return Infinity;
  }
  return systemCost / annualSavingsYear1;
}

/**
 * Calculate payback period with loan financing
 * Takes into account monthly loan payments reducing net savings
 */
export function calculateLoanPayback(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem,
  downPayment: number,
  monthlyLoanPayment: number,
  loanTermYears: number
): number {
  let cumulativeSavings = -downPayment; // Start with negative down payment

  for (let year = 1; year <= 25; year++) {
    const production = calculateProductionWithDegradation(
      system.specifications.annualProductionKwh,
      year,
      system.specifications.degradationRate
    );

    const annualSavings = calculateAnnualSavings(
      homeEnergyData,
      production,
      year,
      system.specifications.gridInteraction.gridFeedRate,
      system.specifications.gridInteraction.netMeteringEnabled
    );

    // Subtract loan payments if still within loan term
    const netAnnualSavings = year <= loanTermYears
      ? annualSavings - (monthlyLoanPayment * 12)
      : annualSavings;

    cumulativeSavings += netAnnualSavings;

    // Return the year when cumulative becomes positive
    if (cumulativeSavings >= 0) {
      // Linear interpolation for more precision
      const prevYear = year - 1;
      const prevCumulative = cumulativeSavings - netAnnualSavings;
      const fraction = -prevCumulative / netAnnualSavings;
      return prevYear + fraction;
    }
  }

  return Infinity; // Never pays back within 25 years
}

/**
 * Calculate net savings over a specified time period
 */
export function calculateNetSavings(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem,
  systemCost: number,
  financing: FinancingOption,
  years: number = 25
): number {
  let totalSavings = 0;
  let totalCosts = systemCost;

  for (let year = 1; year <= years; year++) {
    const production = calculateProductionWithDegradation(
      system.specifications.annualProductionKwh,
      year,
      system.specifications.degradationRate
    );

    const annualSavings = calculateAnnualSavings(
      homeEnergyData,
      production,
      year,
      system.specifications.gridInteraction.gridFeedRate,
      system.specifications.gridInteraction.netMeteringEnabled
    );

    totalSavings += annualSavings;
  }

  // Add loan interest if applicable
  if (financing.type === 'loan' && financing.loanDetails) {
    const financeAmount =
      systemCost *
      (1 - financing.loanDetails.downPaymentPercent / 100);
    const loanInterest = calculateLoanTotalInterest(
      financeAmount,
      financing.loanDetails.interestRate,
      financing.loanDetails.termYears
    );
    totalCosts += loanInterest;
  }

  return totalSavings - totalCosts;
}

/**
 * Calculate 25-year net savings (legacy function for backwards compatibility)
 */
export function calculate25YearNetSavings(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem,
  systemCost: number,
  financing: FinancingOption
): number {
  return calculateNetSavings(homeEnergyData, system, systemCost, financing, 25);
}

/**
 * Calculate ROI percentage
 */
export function calculateROI(netSavings: number, systemCost: number): number {
  if (systemCost === 0) {
    return 0;
  }
  return (netSavings / systemCost) * 100;
}

/**
 * Calculate opportunity cost comparison (solar vs HYSA)
 */
export function calculateOpportunityCost(
  systemCost: number,
  annualSavingsYear1: number,
  hysaRate: number,
  years: number = 25
): {
  solarNetBenefit: number;
  hysaNetBenefit: number;
  difference: number;
} {
  // Solar net benefit (simplified - assumes linear savings)
  const solarNetBenefit = annualSavingsYear1 * years - systemCost;

  // HYSA compound interest
  const hysaNetBenefit =
    systemCost * Math.pow(1 + hysaRate / 100, years) - systemCost;

  return {
    solarNetBenefit,
    hysaNetBenefit,
    difference: solarNetBenefit - hysaNetBenefit,
  };
}

/**
 * Calculate complete financial analysis for a system
 */
export function calculateSystemFinancialAnalysis(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem,
  incentives: Incentives,
  financing: FinancingOption
): SystemFinancialAnalysis {
  const totalCost = calculateSystemTotalCost(system);
  const totalCostAfterIncentives = calculateCostAfterIncentives(
    totalCost,
    incentives
  );

  const annualProductionKwh = system.specifications.annualProductionKwh;
  const annualSavingsYear1 = calculateAnnualSavings(
    homeEnergyData,
    annualProductionKwh,
    1,
    system.specifications.gridInteraction.gridFeedRate,
    system.specifications.gridInteraction.netMeteringEnabled
  );

  const net25YearSavings = calculate25YearNetSavings(
    homeEnergyData,
    system,
    totalCostAfterIncentives,
    financing
  );

  const simplePaybackYears = calculateSimplePayback(
    totalCostAfterIncentives,
    annualSavingsYear1
  );

  const roiPercent = calculateROI(net25YearSavings, totalCostAfterIncentives);

  const analysis: SystemFinancialAnalysis = {
    systemId: system.id,
    totalCost,
    totalCostAfterIncentives,
    annualProductionKwh,
    annualSavingsYear1,
    simplePaybackYears,
    net25YearSavings,
    roiPercent,
    financing,
  };

  // Add loan details if applicable
  if (financing.type === 'loan' && financing.loanDetails) {
    const financeAmount =
      totalCostAfterIncentives *
      (1 - financing.loanDetails.downPaymentPercent / 100);
    analysis.loanMonthlyPayment = calculateLoanMonthlyPayment(
      financeAmount,
      financing.loanDetails.interestRate,
      financing.loanDetails.termYears
    );
    analysis.loanTotalInterest = calculateLoanTotalInterest(
      financeAmount,
      financing.loanDetails.interestRate,
      financing.loanDetails.termYears
    );
  }

  // Add opportunity cost comparison if applicable
  if (
    financing.type === 'opportunity-cost' &&
    financing.opportunityCostDetails
  ) {
    analysis.opportunityCostComparison = calculateOpportunityCost(
      totalCostAfterIncentives,
      annualSavingsYear1,
      financing.opportunityCostDetails.hysaRate
    );
  }

  return analysis;
}

/**
 * Calculate production vs consumption metrics
 */
export function calculateProductionConsumption(
  homeEnergyData: HomeEnergyData,
  system: SolarSystem
): ProductionConsumption {
  const annualProduction = system.specifications.annualProductionKwh;
  const annualConsumption = homeEnergyData.yearlyUsageKwh;

  const excessGeneration = Math.max(0, annualProduction - annualConsumption);
  const gridPurchasesNeeded = Math.max(0, annualConsumption - annualProduction);
  const selfSufficiencyPercent = Math.min(
    100,
    (annualProduction / annualConsumption) * 100
  );

  return {
    annualProduction,
    annualConsumption,
    excessGeneration,
    gridPurchasesNeeded,
    selfSufficiencyPercent,
  };
}
