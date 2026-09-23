import type { Money } from '@pixpilot/cost-calculator';

import type { CreditPackageEconomics, CreditUsageMix } from './types.ts';

import { toMarginStatus } from './margin-status.ts';
import {
  divideMoneyByCount,
  multiplyMoneyByCount,
  subtractMoney,
  toMoney,
} from './money.ts';
import { grossMarginPercent } from './percentage.ts';

const NO_CREDITS = 0;

/** What one package of credits is being sold for, and judged against. */
export interface CreditPackageTerms {
  credits: number;
  healthyMarginPoints: number;
  packagePrice: number;
  standardActionCredits: number;
  targetGrossMarginPercent: number;
}

/**
 * Reads one package of credits as a piece of business: what it costs to
 * honour, what it earns, and whether that clears the target margin.
 *
 * Three costs are reported rather than one, and they are not interchangeable.
 * The expected cost is what the usage mix in the table implies. The worst case
 * is what the package costs if every credit is spent on the least efficient
 * feature — the only figure that is a guarantee. The buffered worst case adds
 * the safety margin on top, and is the one a decision to sell this package
 * should be made against.
 */
export function calculatePackageEconomics(
  mix: CreditUsageMix,
  terms: CreditPackageTerms,
): CreditPackageEconomics {
  const price = toMoney(terms.packagePrice);
  const expectedCost = costOfCredits(mix.weightedAverageCostPerCredit, terms.credits);
  const worstCaseCost = costOfCredits(mix.worstCaseCostPerCredit, terms.credits);
  const bufferedWorstCaseCost = costOfCredits(
    mix.bufferedWorstCaseCostPerCredit,
    terms.credits,
  );
  const expectedMargin = marginPercent(price, expectedCost);
  const worstCaseMargin = marginPercent(price, worstCaseCost);
  const bufferedWorstCaseMargin = marginPercent(price, bufferedWorstCaseCost);

  return {
    bufferedWorstCaseCost,
    bufferedWorstCaseGrossMarginPercent: bufferedWorstCaseMargin,
    bufferedWorstCaseMarginStatus: toMarginStatus(
      bufferedWorstCaseMargin,
      terms.targetGrossMarginPercent,
      terms.healthyMarginPoints,
    ),
    credits: terms.credits,
    expectedCost,
    expectedGrossMarginPercent: expectedMargin,
    expectedMarginStatus: toMarginStatus(
      expectedMargin,
      terms.targetGrossMarginPercent,
      terms.healthyMarginPoints,
    ),
    expectedProfit: profit(price, expectedCost),
    expectedProfitPerCredit: perCredit(profit(price, expectedCost), terms.credits),
    price,
    revenuePerCredit: perCredit(price, terms.credits),
    standardActions:
      terms.standardActionCredits > NO_CREDITS
        ? Math.floor(terms.credits / terms.standardActionCredits)
        : null,
    worstCaseCost,
    worstCaseGrossMarginPercent: worstCaseMargin,
    worstCaseMarginStatus: toMarginStatus(
      worstCaseMargin,
      terms.targetGrossMarginPercent,
      terms.healthyMarginPoints,
    ),
    worstCaseProfit: profit(price, worstCaseCost),
    worstCaseProfitPerCredit: perCredit(profit(price, worstCaseCost), terms.credits),
  };
}

/**
 * `null` rather than zero when there is no rate to cost the credits at. A
 * package whose cost is unknown is not a package that costs nothing, and
 * reporting it as free is the one mistake this screen exists to prevent.
 */
function costOfCredits(costPerCredit: Money | null, credits: number): Money | null {
  return costPerCredit == null ? null : multiplyMoneyByCount(costPerCredit, credits);
}

function profit(price: Money, cost: Money | null): Money | null {
  return cost == null ? null : subtractMoney(price, cost);
}

function marginPercent(price: Money, cost: Money | null): number | null {
  return cost == null ? null : grossMarginPercent(price, cost);
}

function perCredit(amount: Money | null, credits: number): Money | null {
  if (amount == null || credits <= NO_CREDITS) return null;

  return divideMoneyByCount(amount, credits);
}
