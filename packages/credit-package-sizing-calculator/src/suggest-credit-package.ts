import type {
  CreditPricingAssumptions,
  CreditPricingLimits,
  CreditUsageMix,
  SuggestedCreditPackage,
} from './types.ts';

import { calculatePackageEconomics } from './calculate-package-economics.ts';
import { floorToIncrement } from './rounding.ts';

const PERCENT_IN_ONE = 100;

/**
 * Turns the safe maximum into a package worth actually selling.
 *
 * The mathematical maximum is not a recommendation. It is the point at which
 * the target margin is exactly met, with nothing left for the model repricing
 * or the heavy user the safety buffer was already sized for, so the suggestion
 * stops a configurable distance short of it and rounds down to a package
 * increment.
 *
 * It also never suggests giving away *more* than the package already includes.
 * A large safe maximum means the current package has headroom, not that the
 * headroom should be spent: the reason to raise a package is a commercial one,
 * and this calculator has no view on it. So the suggestion only ever lowers a
 * package that has grown past what the target margin supports, and otherwise
 * says the current one is comfortable.
 */
export function suggestCreditPackage(
  mix: CreditUsageMix,
  limits: CreditPricingLimits,
  assumptions: CreditPricingAssumptions,
): SuggestedCreditPackage {
  const conservativeCredits =
    limits.worstCaseSafeCredits == null
      ? null
      : floorToIncrement(
          limits.worstCaseSafeCredits *
            ((PERCENT_IN_ONE - assumptions.recommendationHeadroomPercent) /
              PERCENT_IN_ONE),
          assumptions.creditPackageIncrement,
        );
  const isCurrentPackageComfortable =
    conservativeCredits != null &&
    assumptions.currentPackageCredits <= conservativeCredits;
  const credits =
    conservativeCredits == null
      ? assumptions.currentPackageCredits
      : Math.min(assumptions.currentPackageCredits, conservativeCredits);

  return {
    conservativeCredits,
    credits,
    economics: calculatePackageEconomics(mix, {
      credits,
      healthyMarginPoints: assumptions.healthyMarginPoints,
      packagePrice: assumptions.packagePrice,
      standardActionCredits: assumptions.standardActionCredits,
      targetGrossMarginPercent: assumptions.targetGrossMarginPercent,
    }),
    isCurrentPackageComfortable,
  };
}
