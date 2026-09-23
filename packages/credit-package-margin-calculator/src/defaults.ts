import type { CreditPackageFeatureScenario } from './create-feature-rows.ts';
import type { CreditPackagePricingSettings, FeatureRow, PackageRow } from './types.ts';

import { createFeatureRows } from './create-feature-rows.ts';

const WORKER_COST_PER_EXECUTION = 0.000002;
const PDF_RENDERING_COST_PER_EXECUTION = 0.0005;

/**
 * The scenario the calculator opens on: one active job seeker's month, at the
 * credit prices the product charges today.
 *
 * These are starting points for a what-if, not the product's configuration.
 * An application that maintains its own estimates should seed the calculator
 * with those instead.
 */
export const DEFAULT_FEATURE_SCENARIOS: readonly CreditPackageFeatureScenario[] = [
  {
    creditsPerExecution: 5,
    fixedCostPerExecution: WORKER_COST_PER_EXECUTION,
    inputTokens: 15_000,
    name: 'AI Job Insights',
    outputTokens: 1_000,
    quantity: 100,
  },
  {
    creditsPerExecution: 5,
    fixedCostPerExecution: WORKER_COST_PER_EXECUTION,
    inputTokens: 12_000,
    name: 'AI Resume Parsing',
    outputTokens: 3_000,
    quantity: 2,
  },
  {
    creditsPerExecution: 5,
    fixedCostPerExecution: WORKER_COST_PER_EXECUTION,
    inputTokens: 4_000,
    name: 'AI Cover Letter',
    outputTokens: 1_000,
    quantity: 50,
  },
  {
    creditsPerExecution: 2,
    fixedCostPerExecution: PDF_RENDERING_COST_PER_EXECUTION,
    inputTokens: 0,
    name: 'Cover Letter Export',
    outputTokens: 0,
    quantity: 10,
  },
  {
    creditsPerExecution: 2,
    fixedCostPerExecution: PDF_RENDERING_COST_PER_EXECUTION,
    inputTokens: 0,
    name: 'Resume Export',
    outputTokens: 0,
    quantity: 50,
  },
  {
    creditsPerExecution: 5,
    fixedCostPerExecution: WORKER_COST_PER_EXECUTION,
    inputTokens: 5_000,
    name: 'AI Form Filler Profile',
    outputTokens: 1_500,
    quantity: 1,
  },
  {
    creditsPerExecution: 4,
    fixedCostPerExecution: WORKER_COST_PER_EXECUTION,
    inputTokens: 2_000,
    name: 'AI Form Filler Field',
    outputTokens: 400,
    quantity: 10,
  },
  {
    creditsPerExecution: 5,
    fixedCostPerExecution: PDF_RENDERING_COST_PER_EXECUTION,
    inputTokens: 8_000,
    name: 'AI Tailored Resume',
    outputTokens: 2_000,
    quantity: 15,
  },
];

/** `DEFAULT_FEATURE_SCENARIOS` as the rows the table starts out editing. */
export const DEFAULT_FEATURE_ROWS: readonly FeatureRow[] = createFeatureRows(
  DEFAULT_FEATURE_SCENARIOS,
);

/** The packs on sale today, as the calculator's starting comparison. */
export const DEFAULT_PACKAGE_ROWS: readonly PackageRow[] = [
  { credits: 500, id: 'pack-5', price: 5 },
  { credits: 1_000, id: 'pack-10', price: 10 },
  { credits: 1_500, id: 'pack-15', price: 15 },
];

/** A cheap model and a margin worth opening on, both editable on the screen. */
export const DEFAULT_CREDIT_PACKAGE_PRICING_SETTINGS: CreditPackagePricingSettings = {
  inputPricePerMillionTokens: 0.2,
  outputPricePerMillionTokens: 1.2,
  stripeFeesEnabled: false,
  targetMargin: 80,
};
