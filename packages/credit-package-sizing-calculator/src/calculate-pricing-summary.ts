import type {
  CreditPackageEconomics,
  CreditPackageScenario,
  CreditPricingAssumptions,
  CreditPricingAssumptionsInput,
  CreditPricingFeatureInput,
  CreditPricingSummary,
  CreditUsageMix,
} from './types.ts';

import { calculateMaximumSafeCredits } from './calculate-credit-limits.ts';
import { calculateCreditUsageMix } from './calculate-feature-cost.ts';
import { calculateFreeCreditAnalysis } from './calculate-free-credits.ts';
import { calculatePackageEconomics } from './calculate-package-economics.ts';
import { calculateSubscriptionEconomics } from './calculate-subscription-economics.ts';
import { createCreditPricingFeatures } from './create-credit-pricing-features.ts';
import { creditPricingAssumptionsSchema } from './schemas.ts';
import { suggestCreditPackage } from './suggest-credit-package.ts';

const ASCENDING = 1;
const DESCENDING = -1;

/**
 * The whole calculation, from a list of features to a pricing decision.
 *
 * Everything on this screen is derived here, in one pass, so no two figures
 * can be calculated from different inputs. The four concepts the result keeps
 * apart are deliberately not collapsed into a single number:
 *
 * - the **expected** margin, at the usage distribution in the table;
 * - the **worst-case** margin, if every credit goes to the least efficient
 *   feature;
 * - the **target** margin, the minimum the business wants to hold;
 * - the **safety buffer**, the protection against the estimate itself being
 *   wrong.
 *
 * Reduced to one figure they stop being answerable: a package that fails is
 * failing for one of these reasons, and the fix is different for each.
 *
 * Features are normalised here rather than demanded pre-built, so the scenario
 * list an application already keeps for its cost calculators can be priced as
 * it stands.
 */
export function calculatePricingSummary(
  features: readonly CreditPricingFeatureInput[],
  assumptions: CreditPricingAssumptionsInput,
): CreditPricingSummary {
  const resolvedAssumptions = creditPricingAssumptionsSchema.parse(assumptions);
  const mix = calculateCreditUsageMix(
    createCreditPricingFeatures(features),
    resolvedAssumptions,
  );
  const limits = calculateMaximumSafeCredits(mix, resolvedAssumptions);
  const suggestedPackage = suggestCreditPackage(mix, limits, resolvedAssumptions);

  return {
    assumptions: resolvedAssumptions,
    currentPackage: packageAt(
      mix,
      resolvedAssumptions.currentPackageCredits,
      resolvedAssumptions,
    ),
    freeTier: calculateFreeCreditAnalysis(mix, resolvedAssumptions),
    limits,
    mix,
    scenarios: buildScenarios(mix, resolvedAssumptions),
    subscription: calculateSubscriptionEconomics(
      mix,
      resolvedAssumptions,
      suggestedPackage.credits,
    ),
    suggestedPackage,
  };
}

/**
 * The comparison rows, deduplicated and put in order.
 *
 * Seeing 500, 700 and 1,000 credits side by side at the same price is the
 * fastest way to read what generosity costs: the price does not move, so every
 * extra credit comes straight out of the margin.
 */
function buildScenarios(
  mix: CreditUsageMix,
  assumptions: CreditPricingAssumptions,
): CreditPackageScenario[] {
  return [...new Set(assumptions.scenarioCredits)]
    .sort((first, second) => (first > second ? ASCENDING : DESCENDING))
    .map((credits) => ({
      economics: packageAt(mix, credits, assumptions),
      isCurrent: credits === assumptions.currentPackageCredits,
    }));
}

function packageAt(
  mix: CreditUsageMix,
  credits: number,
  assumptions: CreditPricingAssumptions,
): CreditPackageEconomics {
  return calculatePackageEconomics(mix, {
    credits,
    healthyMarginPoints: assumptions.healthyMarginPoints,
    packagePrice: assumptions.packagePrice,
    standardActionCredits: assumptions.standardActionCredits,
    targetGrossMarginPercent: assumptions.targetGrossMarginPercent,
  });
}
