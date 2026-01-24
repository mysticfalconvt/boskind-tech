# Solar Calculator App - Implementation Plan

## Architecture Overview
- **Framework**: Next.js Pages Router (existing)
- **Styling**: Tailwind CSS + DaisyUI (existing theme system)
- **Storage**: localStorage with JSON import/export
- **Location**: `/pages/solar/index.tsx`

## File Structure
```
pages/solar/
  └── index.tsx (main page with dynamic tab navigation)
components/solar/
  ├── HomeDataTab.tsx
  ├── SystemTab.tsx (reusable, one instance per system)
  ├── SummaryTab.tsx (comparison view)
  ├── IncentivesTab.tsx
  └── SolarChart.tsx (reusable chart component)
lib/solar/
  ├── types.ts (TypeScript interfaces)
  ├── calculations.ts (all calculation logic)
  ├── batteryCalculations.ts (battery-specific logic)
  └── storage.ts (localStorage utilities)
```

## Tab Structure (Dynamic)
1. **Home Energy Data** (fixed tab)
2. **System 1, System 2, System N...** (dynamic tabs with +/duplicate/delete)
3. **Incentives** (fixed tab)
4. **Summary & Comparison** (fixed tab, always last)

## Tab 1: Home Energy Data
**Inputs:**
- Yearly/monthly kWh usage (bidirectional calculation)
- Current electricity rate ($/kWh)
- Net metering buy-back rate ($/kWh, can differ from purchase rate)
- Monthly fixed costs
- Optional: Monthly breakdown for seasonal analysis
- Energy inflation rate (default 3%)

**Outputs:**
- Yearly total cost & usage
- Monthly/daily averages (kWh & cost)
- Seasonal patterns (if monthly data provided)

## Tabs 2-N: Solar System BOM (Dynamic Multi-System)
**Tab Management:**
- "+" button to add new blank system
- "Duplicate" button to copy current system
- "Delete" button (confirm dialog)
- Rename system (e.g., "Basic System", "Premium w/ Batteries")

**BOM Line Items:**
- Pre-populated: Solar Panels, Inverter(s), Batteries, Mounting/Racking, Electrical/Wiring, Installation Labor, Permits/Inspection
- Each with: quantity, unit cost, total, notes
- "Add Custom Item" for miscellaneous

**System Specifications:**
- Panel specs: Wattage per panel, quantity, efficiency
- Total system size (kW) - calculated
- Location/Sun hours per day (or annual irradiance kWh/m²)
- System efficiency factor (default 85%)
- Degradation rate (default 0.5%/year)
- Annual production estimate (calculated or manual override)

**Battery Configuration:**
- Battery capacity (kWh)
- Usable capacity % (default 80-90% for lithium)
- Round-trip efficiency (default 90%)
- Daily usage target (kWh) - for autonomy calculation
- **Autonomy calculator**: Days of backup = (Usable capacity / Daily usage)
- Cloudy/snowy weather scenarios: Reduced production % × autonomy

**Grid Interaction Settings:**
- Net metering: Yes/No
- Grid feed rate ($/kWh) - what utility pays you
- Grid purchase rate ($/kWh) - what you pay utility
- Battery priority: Self-consumption vs grid export

## Incentives Tab
**Manual Entry Fields:**
- Federal tax credit (currently expired, but allow manual %)
- State rebates ($)
- Local utility incentives ($)
- SREC value ($/year, if applicable)
- Apply to: All systems or per-system selection

## Summary & Comparison Tab
**Multi-System Comparison Table:**
- Total system cost (before/after incentives)
- Financing option (Cash/Loan/Opportunity Cost)
- Annual production (Year 1)
- Annual savings (Year 1)
- Simple payback period
- 25-year net savings
- ROI %

**Per-System Deep Dive (Expandable sections):**
1. **Financial Analysis**
   - Cash: Upfront cost, payback timeline
   - Loan: Interest rate, term, down payment → monthly payment, total interest paid
   - Opportunity Cost: HYSA rate → forgone gains vs solar savings

2. **Battery Performance (if equipped)**
   - Autonomy days (full sun)
   - Autonomy days (cloudy weather - 30%, 50%, 70% production)
   - Annual grid purchases vs sales
   - Self-consumption rate %
   - Value of storing vs selling to grid

3. **Production & Consumption**
   - Annual production vs home usage
   - Excess generation (exported to grid)
   - Grid purchases needed
   - Net energy position (self-sufficient %)

**Charts/Visualizations:**
- 25-year cumulative savings comparison (line chart, all systems)
- Annual cash flow (bars: savings - loan payments)
- Production vs consumption by system (stacked bars)
- Battery autonomy comparison (if multiple systems have batteries)
- Grid interaction: Buy vs sell volumes/values
- Degradation impact over time

**Battery Intelligence:**
- Calculate optimal battery size based on daily usage patterns
- Show financial value: Cost of battery vs savings from storing instead of selling at lower grid feed rate
- Time-of-use optimization (if different rates provided)

## Data Management
- Auto-save to localStorage on every change
- Export: "Download Solar Plan.json"
- Import: "Upload Solar Plan.json"
- Clear all data (with confirmation)

## Key Features
1. **True multi-system comparison** - Each system gets its own full tab
2. **Battery intelligence** - Autonomy, weather scenarios, grid interaction economics
3. **Buy-back rate modeling** - Separate grid purchase vs sale rates
4. **Degradation modeling** - Show realistic 25-year performance curve
5. **Financing scenarios** - Cash, loan, opportunity cost all modeled
6. **Incentives flexibility** - Manual entry since federal credit expired

## Navigation Integration
- Add "Solar Calc" link to HeaderNav/Sidebar
- Route: `/solar`

## Blog Post (Post-Implementation)
- Create blog post in `/pages/blog/` directory
- Title: "Introducing the Solar Calculator Tool"
- Topics to cover:
  - What the tool does
  - Why it was built
  - Key features (multi-system comparison, battery analysis, financial modeling)
  - How to use it
  - Technical implementation details
  - Link to the calculator

## Technology Stack
- **State Management**: useState + useContext (for cross-tab data)
- **Charts**: recharts (lightweight, React-friendly) - will need to install
- **Form Handling**: Controlled components with validation
- **Storage**: `lib/solar/storage.ts` with JSON encode/decode
- **Styling**: DaisyUI components (tabs, cards, inputs, buttons, badges)

## Implementation Phases
1. **Phase 1**: Core structure
   - Create file structure
   - Set up types and interfaces
   - Implement localStorage utilities
   - Add navigation links

2. **Phase 2**: Home Data Tab
   - Build form with all inputs
   - Implement calculations
   - Display computed outputs

3. **Phase 3**: System Tabs (Dynamic)
   - Build system tab component
   - Add/duplicate/delete functionality
   - BOM line items
   - System specifications
   - Battery configuration

4. **Phase 4**: Incentives Tab
   - Manual entry form
   - Apply to systems logic

5. **Phase 5**: Summary & Comparison
   - Comparison table
   - Per-system deep dives
   - Charts and visualizations
   - Battery intelligence displays

6. **Phase 6**: Data Management
   - Export JSON
   - Import JSON
   - Auto-save

7. **Phase 7**: Polish & Blog Post
   - Responsive design testing
   - Dark mode verification
   - Write and publish blog post
