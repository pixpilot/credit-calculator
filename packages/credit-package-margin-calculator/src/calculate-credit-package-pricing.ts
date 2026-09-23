import type {
  CalculatedFeatureRow,
  CalculatedPackageRow,
  CreditPackagePricingInput,
  CreditPackagePricingResult,
  CreditPackagePricingSettings,
  FeatureRow,
  MarginStatus,
  PackageRow,
} from './types.ts';

import { creditPackagePricingInputSchema } from './schemas.ts';

const TOKENS_PER_MILLION = 1_000_000;
const PERCENT = 100;
const NOTHING = 0;

/** What the payment processor keeps of one transaction. */
export const STRIPE_PERCENTAGE_RATE = 0.029;
export const STRIPE_FIXED_FEE_USD = 0.3;

/**
 * How far under the target a margin may land before it reads as a problem
 * rather than as a warning. Percentage points, not a proportion.
 */
export const MARGIN_WARNING_BAND = 10;

/**
 * Prices a month of usage: what it costs us, what one credit costs, and what
 * that leaves on each package we sell.
 *
 * Every figure the screen shows is produced here, so the components stay free
 * of financial arithmetic and each formula is testable on its own.
 *
 * Two costs per credit are carried through rather than one. The blended cost
 * is what the supplied usage mix actually costs, and the worst case is what a
 * user who spends every credit on the costliest feature costs. A package is
 * only genuinely safe when it clears the target margin on the second, so the
 * calculator never collapses them into a single number.
 *
 * A rate with no denominator — a feature charging no credits, a month with no
 * credits issued — is reported as `null` rather than as `Infinity` or `NaN`.
 * Nothing downstream then has to guard against a figure that is not a number.
 */
export function calculateCreditPackagePricing(
  input: CreditPackagePricingInput,
): CreditPackagePricingResult {
  const { features, packages, settings } = creditPackagePricingInputSchema.parse(input);

  const costedFeatures = features.map((feature) => costFeature(feature, settings));
  const totalCost = sum(costedFeatures.map((feature) => feature.totalCost));
  const totalCredits = sum(costedFeatures.map((feature) => feature.totalCredits));
  const blendedCostPerCredit = totalCredits === NOTHING ? null : totalCost / totalCredits;
  const worstCase = findWorstCase(costedFeatures);

  return {
    blendedCostPerCredit,
    features: costedFeatures.map((feature) => ({
      ...feature,
      isWorstCase: feature.feature.id === worstCase?.feature.id,
    })),
    packages: packages.map((packageRow) =>
      pricePackage(packageRow, {
        blendedCostPerCredit,
        settings,
        worstCostPerCredit: worstCase?.costPerCredit ?? null,
      }),
    ),
    settings,
    totalCost,
    totalCredits,
    worstCostPerCredit: worstCase?.costPerCredit ?? null,
    worstFeature: worstCase?.feature ?? null,
  };
}

/** How a margin stands against the target, once it is known at all. */
export function toMarginStatus(
  margin: number | null,
  targetMargin: number,
): MarginStatus {
  if (margin == null) return 'unknown';
  if (margin >= targetMargin) return 'on-target';

  return margin >= targetMargin - MARGIN_WARNING_BAND ? 'near-target' : 'below-target';
}

function costFeature(
  feature: FeatureRow,
  settings: CreditPackagePricingSettings,
): Omit<CalculatedFeatureRow, 'isWorstCase'> {
  const variableCost =
    feature.fixedCost +
    (feature.inputTokens / TOKENS_PER_MILLION) * settings.inputPricePerMillionTokens +
    (feature.outputTokens / TOKENS_PER_MILLION) * settings.outputPricePerMillionTokens;

  return {
    costPerCredit:
      feature.creditCost === NOTHING ? null : variableCost / feature.creditCost,
    feature,
    totalCost: variableCost * feature.quantity,
    totalCredits: feature.creditCost * feature.quantity,
    variableCost,
  };
}

/**
 * The feature one credit is dearest on.
 *
 * A feature charging no credits is skipped rather than treated as free: it has
 * no cost per credit to compare, and reading it as zero would hide whichever
 * priced feature is genuinely the worst.
 */
function findWorstCase(
  features: readonly Omit<CalculatedFeatureRow, 'isWorstCase'>[],
): { costPerCredit: number; feature: FeatureRow } | null {
  return features.reduce<{ costPerCredit: number; feature: FeatureRow } | null>(
    (worst, candidate) => {
      if (candidate.costPerCredit == null) return worst;
      if (worst != null && candidate.costPerCredit <= worst.costPerCredit) return worst;

      return { costPerCredit: candidate.costPerCredit, feature: candidate.feature };
    },
    null,
  );
}

function pricePackage(
  packageRow: PackageRow,
  context: {
    blendedCostPerCredit: number | null;
    settings: CreditPackagePricingSettings;
    worstCostPerCredit: number | null;
  },
): CalculatedPackageRow {
  const { blendedCostPerCredit, settings, worstCostPerCredit } = context;
  const stripeFee = settings.stripeFeesEnabled
    ? packageRow.price * STRIPE_PERCENTAGE_RATE + STRIPE_FIXED_FEE_USD
    : NOTHING;
  const netRevenue = packageRow.price - stripeFee;
  const blendedMargin = toMargin(packageRow, netRevenue, blendedCostPerCredit);
  const worstMargin = toMargin(packageRow, netRevenue, worstCostPerCredit);

  return {
    blendedMargin,
    blendedStatus: toMarginStatus(blendedMargin, settings.targetMargin),
    netRevenue,
    packageRow,
    stripeFee,
    suggestedCreditsBlended: toSuggestedCredits(
      netRevenue,
      settings.targetMargin,
      blendedCostPerCredit,
    ),
    suggestedCreditsWorst: toSuggestedCredits(
      netRevenue,
      settings.targetMargin,
      worstCostPerCredit,
    ),
    worstMargin,
    worstStatus: toMarginStatus(worstMargin, settings.targetMargin),
  };
}

/** Gross margin on the price charged, measured after any processor fee. */
function toMargin(
  packageRow: PackageRow,
  netRevenue: number,
  costPerCredit: number | null,
): number | null {
  if (costPerCredit == null || packageRow.price === NOTHING) return null;

  return ((netRevenue - packageRow.credits * costPerCredit) / packageRow.price) * PERCENT;
}

/**
 * The most credits a price could carry and still reach the target margin.
 *
 * Rounded down, because the credit above the ceiling is the one that breaks
 * the target, and floored at zero: a price whose processor fee already exceeds
 * it can afford no credits at all, which is worth saying plainly rather than
 * as a negative allowance.
 */
function toSuggestedCredits(
  netRevenue: number,
  targetMargin: number,
  costPerCredit: number | null,
): number | null {
  if (costPerCredit == null || costPerCredit <= NOTHING) return null;

  const allowedCost = netRevenue * (1 - targetMargin / PERCENT);

  return Math.max(NOTHING, Math.floor(allowedCost / costPerCredit));
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, NOTHING);
}
