import type {
  CreditPricingAssumptionsInput,
  CreditPricingFeatureInput,
} from '../src/index.ts';

/**
 * The pricing strategy this calculator was built to check, exactly as an
 * administrator would type it in.
 *
 * Kept as loose input rather than normalised rows so the tests exercise the
 * same path an application does when it hands over a scenario list it already
 * keeps for its cost calculators.
 */
export const INITIAL_FEATURES: readonly CreditPricingFeatureInput[] = [
  {
    creditsPerExecution: 5,
    fixedCostName: 'Worker execution',
    fixedCostPerExecution: 0.000002,
    inputTokens: 15_000,
    name: 'AI Job Insights',
    outputTokens: 1_000,
    quantity: 100,
  },
  {
    creditsPerExecution: 5,
    fixedCostName: 'Worker execution',
    fixedCostPerExecution: 0.000002,
    inputTokens: 12_000,
    name: 'AI Resume Parsing',
    outputTokens: 3_000,
    quantity: 2,
  },
  {
    creditsPerExecution: 5,
    fixedCostName: 'Worker execution',
    fixedCostPerExecution: 0.000002,
    inputTokens: 4_000,
    name: 'AI Cover Letter',
    outputTokens: 1_000,
    quantity: 50,
  },
  {
    creditsPerExecution: 2,
    fixedCostName: 'PDF rendering',
    fixedCostPerExecution: 0.0005,
    inputTokens: 0,
    name: 'Cover Letter Export',
    outputTokens: 0,
    quantity: 10,
  },
  {
    creditsPerExecution: 2,
    fixedCostName: 'PDF rendering',
    fixedCostPerExecution: 0.0005,
    inputTokens: 0,
    name: 'Resume Export',
    outputTokens: 0,
    quantity: 50,
  },
  {
    creditsPerExecution: 5,
    fixedCostName: 'Worker execution',
    fixedCostPerExecution: 0.000002,
    inputTokens: 5_000,
    name: 'AI Form Filler Profile',
    outputTokens: 1_500,
    quantity: 1,
  },
  {
    creditsPerExecution: 4,
    fixedCostName: 'Worker execution',
    fixedCostPerExecution: 0.000002,
    inputTokens: 2_000,
    name: 'AI Form Filler Field',
    outputTokens: 400,
    quantity: 10,
  },
  {
    creditsPerExecution: 5,
    fixedCostName: 'PDF rendering',
    fixedCostPerExecution: 0.0005,
    inputTokens: 8_000,
    name: 'AI Tailored Resume',
    outputTokens: 2_000,
    quantity: 15,
  },
];

/** The assumptions the strategy above is priced against. */
export const INITIAL_ASSUMPTIONS: CreditPricingAssumptionsInput = {
  currentPackageCredits: 500,
  freeCreditsPerWeek: 25,
  inputCostPerMillionTokens: 0.2,
  outputCostPerMillionTokens: 1.2,
  packagePrice: 5,
  safetyBufferPercent: 20,
  subscriptionCreditBonusPercent: 40,
  targetGrossMarginPercent: 80,
};
