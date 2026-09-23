import type {
  CreditPricingAssumptions,
  CreditSubscriptionRecommendation,
  CreditUsageMix,
} from './types.ts';

import { calculatePackageEconomics } from './calculate-package-economics.ts';
import { roundToIncrement } from './rounding.ts';

const PERCENT_IN_ONE = 100;

/**
 * The subscription: the same nominal price, with more credits for committing
 * to it.
 *
 * The bonus is applied to the package this calculator recommends rather than
 * to the one currently on sale, so a package that has to shrink takes the
 * subscription down with it instead of quietly leaving the recurring plan
 * selling credits the target margin no longer covers.
 *
 * Whether the bonus is affordable is answered against the buffered worst case,
 * not the expected mix. A subscriber picks their own usage, over and over, and
 * is the most likely person in the product to find the feature that costs the
 * most per credit.
 */
export function calculateSubscriptionEconomics(
  mix: CreditUsageMix,
  assumptions: CreditPricingAssumptions,
  packageCredits: number,
): CreditSubscriptionRecommendation {
  const credits = roundToIncrement(
    (packageCredits * (PERCENT_IN_ONE + assumptions.subscriptionCreditBonusPercent)) /
      PERCENT_IN_ONE,
    assumptions.creditPackageIncrement,
  );
  const economics = calculatePackageEconomics(mix, {
    credits,
    healthyMarginPoints: assumptions.healthyMarginPoints,
    packagePrice: assumptions.packagePrice,
    standardActionCredits: assumptions.standardActionCredits,
    targetGrossMarginPercent: assumptions.targetGrossMarginPercent,
  });

  return {
    bonusPercent: assumptions.subscriptionCreditBonusPercent,
    credits,
    economics,
    violatesTargetMargin: economics.bufferedWorstCaseMarginStatus === 'below-target',
  };
}
