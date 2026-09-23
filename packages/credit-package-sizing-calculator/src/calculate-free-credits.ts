import type {
  CreditPricingAssumptions,
  CreditUsageMix,
  FreeCreditAnalysis,
} from './types.ts';

import { scaleMoney } from './money.ts';

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;
const NO_CREDITS = 0;

/**
 * What the free weekly allowance costs, on its own.
 *
 * It is reported separately and never folded into a package margin. Free
 * credits earn no revenue, so mixing them into the paid economics would drag
 * every margin on the screen down by an amount that depends on how many free
 * users there are — a figure this calculator does not have and should not
 * guess. Kept apart, the allowance reads as what it is: a marketing cost with
 * a monthly price tag.
 *
 * A month is a year over twelve rather than four weeks, so the estimate does
 * not quietly lose four weeks of giveaway a year.
 */
export function calculateFreeCreditAnalysis(
  mix: CreditUsageMix,
  assumptions: Pick<
    CreditPricingAssumptions,
    'freeCreditsPerWeek' | 'standardActionCredits'
  >,
): FreeCreditAnalysis {
  const annualCredits = assumptions.freeCreditsPerWeek * WEEKS_PER_YEAR;

  return {
    creditsPerWeek: assumptions.freeCreditsPerWeek,
    expectedMonthlyCost:
      mix.weightedAverageCostPerCredit == null
        ? null
        : scaleMoney(
            mix.weightedAverageCostPerCredit,
            BigInt(annualCredits),
            BigInt(MONTHS_PER_YEAR),
          ),
    monthlyCredits: annualCredits / MONTHS_PER_YEAR,
    standardActionsPerWeek:
      assumptions.standardActionCredits > NO_CREDITS
        ? assumptions.freeCreditsPerWeek / assumptions.standardActionCredits
        : null,
  };
}
