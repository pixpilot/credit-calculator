import type { Money } from '@pixpilot/cost-calculator';

import type {
  CreditPricingAssumptions,
  CreditPricingLimits,
  CreditUsageMix,
} from './types.ts';

import { divideMoneyToCount, scaleMoney, toMoney } from './money.ts';
import { ONE_IN_MICRO_PERCENT, remainingShare } from './percentage.ts';

/**
 * The most credits a package price may include and still hold the target
 * margin.
 *
 * The target margin fixes what share of the price may be spent on cost of
 * goods sold; dividing that allowance by what a credit costs gives the credits
 * it buys. Both limits are reported because they answer different questions,
 * and only one of them is a promise:
 *
 * - the worst-case limit holds however users spend their credits;
 * - the expected-mix limit holds only while the usage in the table does.
 *
 * Both are taken against the *buffered* cost, so the limits already carry the
 * protection the safety buffer was configured for rather than needing it
 * applied again by whoever reads them.
 */
export function calculateMaximumSafeCredits(
  mix: CreditUsageMix,
  assumptions: Pick<
    CreditPricingAssumptions,
    'packagePrice' | 'targetGrossMarginPercent'
  >,
): CreditPricingLimits {
  const allowedCogs = scaleMoney(
    toMoney(assumptions.packagePrice),
    remainingShare(assumptions.targetGrossMarginPercent),
    ONE_IN_MICRO_PERCENT,
  );

  return {
    allowedCogs,
    expectedMixSafeCredits: safeCredits(
      allowedCogs,
      mix.bufferedWeightedAverageCostPerCredit,
    ),
    worstCaseSafeCredits: safeCredits(allowedCogs, mix.bufferedWorstCaseCostPerCredit),
  };
}

/**
 * `null` when credits cost nothing to honour, or when there is no cost rate at
 * all: an unbounded limit is not a number, and showing one as `Infinity` reads
 * as permission to give away as many credits as the package can hold.
 */
function safeCredits(
  allowedCogs: Money,
  bufferedCostPerCredit: Money | null,
): number | null {
  return bufferedCostPerCredit == null
    ? null
    : divideMoneyToCount(allowedCogs, bufferedCostPerCredit);
}
