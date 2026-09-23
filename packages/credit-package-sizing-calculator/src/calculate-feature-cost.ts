import type { Money } from '@pixpilot/cost-calculator';

import type {
  CalculatedCreditPricingFeature,
  CreditPricingAssumptions,
  CreditPricingFeature,
  CreditUsageMix,
} from './types.ts';

import {
  addMoney,
  compareMoney,
  divideMoneyByCount,
  multiplyMoneyByCount,
  scaleMoney,
  toMoney,
  ZERO_USD,
} from './money.ts';
import { addedShare, ONE_IN_MICRO_PERCENT } from './percentage.ts';

const TOKENS_PER_MILLION = 1_000_000n;
const NOTHING = 0;
const HIGHER = 1;

/** The token rates one feature is costed against. */
export interface TokenPricing {
  inputCostPerMillionTokens: number;
  outputCostPerMillionTokens: number;
}

/**
 * Costs one feature: what a single execution costs us, what that makes one of
 * its credits cost, and what its expected runs add up to.
 *
 * The cost per credit is the figure everything downstream is built from. It is
 * what lets a $5 package be reasoned about at all: a feature charging five
 * credits for a two-tenths-of-a-cent execution is a different business from
 * one charging five credits for a whole cent, and only the per-credit rate
 * makes the two comparable.
 */
export function calculateFeatureCost(
  feature: CreditPricingFeature,
  pricing: TokenPricing,
): Omit<CalculatedCreditPricingFeature, 'isWorstCase'> {
  const inputCostPerExecution = tokenCost(
    pricing.inputCostPerMillionTokens,
    feature.inputTokens,
  );
  const outputCostPerExecution = tokenCost(
    pricing.outputCostPerMillionTokens,
    feature.outputTokens,
  );
  const fixedCostPerExecution = toMoney(feature.fixedCostPerExecution);
  const costPerExecution = addMoney([
    inputCostPerExecution,
    outputCostPerExecution,
    fixedCostPerExecution,
  ]);

  return {
    costPerCredit: divideMoneyByCount(costPerExecution, feature.creditsPerExecution),
    costPerExecution,
    creditsPerExecution: feature.creditsPerExecution,
    fixedCostName: feature.fixedCostName ?? null,
    fixedCostPerExecution,
    id: feature.id,
    inputCostPerExecution,
    inputTokens: feature.inputTokens,
    name: feature.name,
    outputCostPerExecution,
    outputTokens: feature.outputTokens,
    quantity: feature.quantity,
    totalCost: multiplyMoneyByCount(costPerExecution, feature.quantity),
    totalCredits: feature.creditsPerExecution * feature.quantity,
  };
}

/**
 * Rolls the features up into the two rates a credit price is judged against.
 *
 * The weighted average is taken as total cost over total credits, never as the
 * mean of the per-feature rates: averaging the rates weights a feature that
 * runs twice a month the same as one that runs a hundred times, which is how a
 * mix dominated by a cheap feature comes out looking as expensive as its
 * rarest one.
 *
 * The worst case is the highest per-credit rate in the table, whatever its
 * expected usage. It answers a different question — not "what will this cost"
 * but "what could this cost if every credit went to the least efficient
 * feature" — and a package sized on the average alone has no answer to it.
 */
export function calculateCreditUsageMix(
  features: readonly CreditPricingFeature[],
  assumptions: Pick<
    CreditPricingAssumptions,
    'inputCostPerMillionTokens' | 'outputCostPerMillionTokens' | 'safetyBufferPercent'
  >,
): CreditUsageMix {
  const costed = features.map((feature) => calculateFeatureCost(feature, assumptions));
  const worstCase = costed.reduce<(typeof costed)[number] | null>(
    (worst, feature) =>
      worst == null || compareMoney(feature.costPerCredit, worst.costPerCredit) === HIGHER
        ? feature
        : worst,
    null,
  );

  const expectedTotalCost = addMoney(costed.map((feature) => feature.totalCost));
  const expectedTotalCredits = costed.reduce(
    (total, feature) => total + feature.totalCredits,
    NOTHING,
  );
  const weightedAverageCostPerCredit =
    expectedTotalCredits > NOTHING
      ? divideMoneyByCount(expectedTotalCost, expectedTotalCredits)
      : null;
  const worstCaseCostPerCredit = worstCase?.costPerCredit ?? null;
  const buffer = addedShare(assumptions.safetyBufferPercent);

  return {
    bufferedWeightedAverageCostPerCredit: applyBuffer(
      weightedAverageCostPerCredit,
      buffer,
    ),
    bufferedWorstCaseCostPerCredit: applyBuffer(worstCaseCostPerCredit, buffer),
    expectedTotalCost,
    expectedTotalCredits,
    features: costed.map((feature) => ({
      ...feature,
      isWorstCase: feature.id === worstCase?.id,
    })),
    safetyBufferPercent: assumptions.safetyBufferPercent,
    weightedAverageCostPerCredit,
    worstCaseCostPerCredit,
    worstCaseFeatureId: worstCase?.id ?? null,
  };
}

/**
 * The safety buffer raises the assumed cost, never the assumed revenue.
 *
 * Padding revenue would answer a question nobody asked — what if we charged
 * more — while the risks the buffer exists for are all on the cost side: a
 * model repricing, a retry, a token estimate that was low.
 */
function applyBuffer(costPerCredit: Money | null, buffer: bigint): Money | null {
  return costPerCredit == null
    ? null
    : scaleMoney(costPerCredit, buffer, ONE_IN_MICRO_PERCENT);
}

/** One side of a token-priced execution, at the rate quoted per million. */
function tokenCost(pricePerMillionTokens: number, tokens: number): Money {
  if (tokens === NOTHING) return ZERO_USD;

  return scaleMoney(toMoney(pricePerMillionTokens), BigInt(tokens), TOKENS_PER_MILLION);
}
