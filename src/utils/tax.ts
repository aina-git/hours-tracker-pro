// ─── Real US Tax Engine (matches TaxPilot) ───────────────────────────────────
// Sources: IRS Rev. Proc. 2024-40 (tax year 2025), SSA 2025 wage base announcement

export type FilingStatus =
  | 'single'
  | 'married_filing_jointly'
  | 'married_filing_separately'
  | 'head_of_household';

// ─── Federal brackets (2025 tax year — IRS Rev. Proc. 2024-40) ───────────────
type Bracket = { rate: number; upTo: number | null };

const FEDERAL_BRACKETS: Record<FilingStatus, Bracket[]> = {
  single: [
    { rate: 0.10, upTo: 11_925 },
    { rate: 0.12, upTo: 48_475 },
    { rate: 0.22, upTo: 103_350 },
    { rate: 0.24, upTo: 197_300 },
    { rate: 0.32, upTo: 250_525 },
    { rate: 0.35, upTo: 626_350 },
    { rate: 0.37, upTo: null },
  ],
  married_filing_jointly: [
    { rate: 0.10, upTo: 23_850 },
    { rate: 0.12, upTo: 96_950 },
    { rate: 0.22, upTo: 206_700 },
    { rate: 0.24, upTo: 394_600 },
    { rate: 0.32, upTo: 501_050 },
    { rate: 0.35, upTo: 751_600 },
    { rate: 0.37, upTo: null },
  ],
  married_filing_separately: [
    { rate: 0.10, upTo: 11_925 },
    { rate: 0.12, upTo: 48_475 },
    { rate: 0.22, upTo: 103_350 },
    { rate: 0.24, upTo: 197_300 },
    { rate: 0.32, upTo: 250_525 },
    { rate: 0.35, upTo: 375_800 },
    { rate: 0.37, upTo: null },
  ],
  head_of_household: [
    { rate: 0.10, upTo: 17_000 },
    { rate: 0.12, upTo: 64_850 },
    { rate: 0.22, upTo: 103_350 },
    { rate: 0.24, upTo: 197_300 },
    { rate: 0.32, upTo: 250_500 },
    { rate: 0.35, upTo: 626_350 },
    { rate: 0.37, upTo: null },
  ],
};

/** Calculate federal income tax for a given annual gross income */
export function calcFederalTax(annualGross: number, filing: FilingStatus): number {
  const brackets = FEDERAL_BRACKETS[filing];
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (b.upTo === null) {
      tax += (annualGross - prev) * b.rate;
      break;
    }
    const taxable = Math.min(annualGross, b.upTo) - prev;
    if (taxable <= 0) break;
    tax += taxable * b.rate;
    prev = b.upTo;
    if (annualGross <= b.upTo) break;
  }
  return Math.max(0, tax);
}

// ─── FICA ────────────────────────────────────────────────────────────────────
const SS_RATE = 0.062;        // Social Security employee rate
const MEDICARE_RATE = 0.0145; // Medicare employee rate
const SS_WAGE_BASE = 176_100; // 2025 SS wage base (SSA announcement Oct 2024)

export function calcFICA(annualGross: number): { socialSecurity: number; medicare: number } {
  const ssWages = Math.min(annualGross, SS_WAGE_BASE);
  return {
    socialSecurity: ssWages * SS_RATE,
    medicare: annualGross * MEDICARE_RATE,
  };
}

// ─── State income tax ─────────────────────────────────────────────────────────
// No-income-tax states
const NO_TAX_STATES = new Set(['AK', 'FL', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY', 'NH']);

type StateBracket = { rate: number; upTo: number | null };

const STATE_BRACKETS: Record<string, StateBracket[]> = {
  CA: [
    { rate: 0.01,  upTo: 10_412 },
    { rate: 0.02,  upTo: 24_684 },
    { rate: 0.04,  upTo: 38_959 },
    { rate: 0.06,  upTo: 54_081 },
    { rate: 0.08,  upTo: 68_350 },
    { rate: 0.093, upTo: 349_137 },
    { rate: 0.103, upTo: 418_961 },
    { rate: 0.113, upTo: 698_274 },
    { rate: 0.123, upTo: null },
  ],
  NY: [
    { rate: 0.04,   upTo: 17_150 },
    { rate: 0.045,  upTo: 23_600 },
    { rate: 0.0525, upTo: 27_900 },
    { rate: 0.055,  upTo: 161_550 },
    { rate: 0.06,   upTo: 323_200 },
    { rate: 0.0685, upTo: 2_155_350 },
    { rate: 0.0965, upTo: null },
  ],
  MD: [
    { rate: 0.02,   upTo: 1_000 },
    { rate: 0.03,   upTo: 2_000 },
    { rate: 0.04,   upTo: 3_000 },
    { rate: 0.0475, upTo: 100_000 },
    { rate: 0.05,   upTo: 125_000 },
    { rate: 0.0525, upTo: 150_000 },
    { rate: 0.055,  upTo: 250_000 },
    { rate: 0.0575, upTo: null },
  ],
  VA: [
    { rate: 0.02,   upTo: 3_000 },
    { rate: 0.03,   upTo: 5_000 },
    { rate: 0.05,   upTo: 17_000 },
    { rate: 0.0575, upTo: null },
  ],
  DC: [
    { rate: 0.04,   upTo: 10_000 },
    { rate: 0.06,   upTo: 40_000 },
    { rate: 0.065,  upTo: 60_000 },
    { rate: 0.085,  upTo: 350_000 },
    { rate: 0.0925, upTo: 1_000_000 },
    { rate: 0.1075, upTo: null },
  ],
  IL: [{ rate: 0.0495, upTo: null }],
  PA: [{ rate: 0.0307, upTo: null }],
  OH: [
    { rate: 0.0,    upTo: 26_050 },
    { rate: 0.02765, upTo: 46_100 },
    { rate: 0.03226, upTo: 92_150 },
    { rate: 0.03688, upTo: 115_300 },
    { rate: 0.03990, upTo: null },
  ],
  GA: [
    { rate: 0.01,  upTo: 750 },
    { rate: 0.02,  upTo: 2_250 },
    { rate: 0.03,  upTo: 3_750 },
    { rate: 0.04,  upTo: 5_250 },
    { rate: 0.05,  upTo: 7_000 },
    { rate: 0.055, upTo: null },
  ],
  NC: [{ rate: 0.0475, upTo: null }],
  AZ: [{ rate: 0.025, upTo: null }],
  CO: [{ rate: 0.044, upTo: null }],
  MI: [{ rate: 0.0405, upTo: null }],
  MN: [
    { rate: 0.0535, upTo: 31_690 },
    { rate: 0.068,  upTo: 104_090 },
    { rate: 0.0785, upTo: 193_240 },
    { rate: 0.0985, upTo: null },
  ],
  OR: [
    { rate: 0.0475, upTo: 18_400 },
    { rate: 0.0675, upTo: 250_000 },
    { rate: 0.099,  upTo: null },
  ],
  WI: [
    { rate: 0.035,  upTo: 13_810 },
    { rate: 0.044,  upTo: 27_630 },
    { rate: 0.053,  upTo: 304_170 },
    { rate: 0.0765, upTo: null },
  ],
  MA: [{ rate: 0.05, upTo: null }],
  NJ: [
    { rate: 0.014,  upTo: 20_000 },
    { rate: 0.0175, upTo: 35_000 },
    { rate: 0.035,  upTo: 40_000 },
    { rate: 0.05525,upTo: 75_000 },
    { rate: 0.0637, upTo: 500_000 },
    { rate: 0.0897, upTo: null },
  ],
  CT: [
    { rate: 0.02,   upTo: 10_000 },
    { rate: 0.045,  upTo: 50_000 },
    { rate: 0.055,  upTo: 100_000 },
    { rate: 0.06,   upTo: 200_000 },
    { rate: 0.065,  upTo: 250_000 },
    { rate: 0.069,  upTo: 500_000 },
    { rate: 0.0699, upTo: null },
  ],
};

function applyBrackets(income: number, brackets: StateBracket[]): number {
  let tax = 0;
  let prev = 0;
  for (const b of brackets) {
    if (b.upTo === null) {
      tax += (income - prev) * b.rate;
      break;
    }
    const taxable = Math.min(income, b.upTo) - prev;
    if (taxable <= 0) break;
    tax += taxable * b.rate;
    prev = b.upTo;
    if (income <= b.upTo) break;
  }
  return Math.max(0, tax);
}

export function calcStateTax(annualGross: number, state: string): number {
  if (NO_TAX_STATES.has(state)) return 0;
  const brackets = STATE_BRACKETS[state];
  if (brackets) return applyBrackets(annualGross, brackets);
  // Default for states not explicitly listed: 5% flat
  return annualGross * 0.05;
}

// ─── Combined net pay breakdown ───────────────────────────────────────────────
export interface TaxBreakdown {
  grossAnnual: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  totalTax: number;
  netAnnual: number;
  effectiveRate: number; // as decimal e.g. 0.28
}

export function calcNetPay(
  grossAnnual: number,
  filing: FilingStatus,
  state: string,
): TaxBreakdown {
  const federalTax = calcFederalTax(grossAnnual, filing);
  const stateTax = calcStateTax(grossAnnual, state);
  const { socialSecurity, medicare } = calcFICA(grossAnnual);
  const totalTax = federalTax + stateTax + socialSecurity + medicare;
  const netAnnual = grossAnnual - totalTax;
  const effectiveRate = grossAnnual > 0 ? totalTax / grossAnnual : 0;

  return {
    grossAnnual,
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    totalTax,
    netAnnual,
    effectiveRate,
  };
}

/** Scale annual net pay to per-dollar-of-gross earned.
 *  Use this to convert any gross amount to its estimated net. */
export function grossToNet(gross: number, filing: FilingStatus, state: string): number {
  if (gross <= 0) return 0;
  // We annualise the shift gross assuming ~2080 hr/year work year for bracket accuracy,
  // then scale the net rate back to the actual gross amount.
  // Calculate marginal effective rate at this gross level on annualised basis
  const sampleAnnual = Math.max(gross * 52, 1); // assume weekly equivalent for bracket context
  const bd = calcNetPay(sampleAnnual, filing, state);
  const netRate = 1 - bd.effectiveRate;
  return gross * netRate;
}

// ─── US States list for UI ────────────────────────────────────────────────────
export const US_STATES: { code: string; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska (No Tax)' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DC', name: 'D.C.' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida (No Tax)' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada (No Tax)' },
  { code: 'NH', name: 'New Hampshire (No Tax)' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota (No Tax)' },
  { code: 'TN', name: 'Tennessee (No Tax)' },
  { code: 'TX', name: 'Texas (No Tax)' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington (No Tax)' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming (No Tax)' },
];

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  single: 'Single',
  married_filing_jointly: 'Married Filing Jointly',
  married_filing_separately: 'Married Filing Separately',
  head_of_household: 'Head of Household',
};
