// Type definitions for Solar Calculator

export interface HomeEnergyData {
  yearlyUsageKwh: number;
  monthlyUsageKwh: number;
  electricityRate: number; // $/kWh
  gridBuybackRate: number; // $/kWh - what utility pays you
  monthlyFixedCosts: number;
  energyInflationRate: number; // percentage
  monthlyBreakdown?: number[]; // Optional 12-month breakdown
  hysaRate?: number; // HYSA interest rate for opportunity cost analysis, default 4.5%
}

export interface BOMLineItem {
  id: string;
  category: string;
  description: string;
  quantity: number;
  unitCost: number;
  notes?: string;
}

export interface BatteryConfig {
  capacityKwh: number;
  usableCapacityPercent: number; // 80-90% typically
  roundTripEfficiency: number; // 90% typically
  dailyUsageTarget: number; // kWh per day
}

export interface GridInteraction {
  netMeteringEnabled: boolean;
  gridFeedRate: number; // $/kWh - what they pay you
  gridPurchaseRate: number; // $/kWh - what you pay
  batteryPriority: 'self-consumption' | 'grid-export';
}

export interface SystemSpecifications {
  panelWattage: number;
  panelQuantity: number;
  panelEfficiency: number; // percentage
  locationSunHoursPerDay: number;
  systemEfficiencyFactor: number; // 85% default
  degradationRate: number; // 0.5% per year default
  annualProductionKwh: number; // calculated or manual override
  battery?: BatteryConfig;
  gridInteraction: GridInteraction;
}

export interface SolarSystem {
  id: string;
  name: string;
  bomItems: BOMLineItem[];
  specifications: SystemSpecifications;
  simpleMode?: boolean;
  simpleTotalCost?: number;
  simpleSpecMode?: boolean;
  simpleSystemSizeKw?: number;
  // Financing parameters (per-system since different providers have different terms)
  loanInterestRate?: number; // percentage, default 6
  loanTermYears?: number; // years, default 15
  loanDownPaymentPercent?: number; // percentage, default 20
  loanDownPaymentDollar?: number; // dollar amount
  downPaymentMode?: 'percent' | 'dollar'; // default 'percent'
}

export interface Incentives {
  federalTaxCreditPercent: number;
  stateRebate: number; // $
  localUtilityIncentives: number; // $
  srecValuePerYear: number; // $ per year
  applyToAllSystems: boolean;
  perSystemIncentives?: { [systemId: string]: Incentives };
}

export interface FinancingOption {
  type: 'cash' | 'loan' | 'opportunity-cost';
  loanDetails?: {
    interestRate: number; // percentage
    termYears: number;
    downPaymentPercent: number;
  };
  opportunityCostDetails?: {
    hysaRate: number; // percentage - High Yield Savings Account
  };
}

export interface SystemFinancialAnalysis {
  systemId: string;
  totalCost: number;
  totalCostAfterIncentives: number;
  annualProductionKwh: number;
  annualSavingsYear1: number;
  simplePaybackYears: number;
  net25YearSavings: number;
  roiPercent: number;
  financing: FinancingOption;
  loanMonthlyPayment?: number;
  loanTotalInterest?: number;
  opportunityCostComparison?: {
    solarNetBenefit: number;
    hysaNetBenefit: number;
    difference: number;
  };
}

export interface BatteryPerformance {
  autonomyDaysSunny: number;
  autonomyDaysCloudy30: number;
  autonomyDaysCloudy50: number;
  autonomyDaysCloudy70: number;
  annualGridPurchases: number; // kWh
  annualGridSales: number; // kWh
  selfConsumptionRate: number; // percentage
  valueOfStoringVsSelling: number; // $
}

export interface ProductionConsumption {
  annualProduction: number; // kWh
  annualConsumption: number; // kWh
  excessGeneration: number; // kWh - exported to grid
  gridPurchasesNeeded: number; // kWh
  selfSufficiencyPercent: number;
}

export interface SolarCalculatorData {
  homeEnergyData: HomeEnergyData;
  systems: SolarSystem[];
  incentives: Incentives;
  activeSystemId?: string;
}

// Chart data types
export interface CumulativeSavingsDataPoint {
  year: number;
  [systemId: string]: number; // Dynamic keys for each system
}

export interface AnnualCashFlowDataPoint {
  year: number;
  systemId: string;
  savings: number;
  loanPayment: number;
  netCashFlow: number;
}
