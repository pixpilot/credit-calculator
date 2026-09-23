import type { Money } from '@pixpilot/cost-calculator';

import type {
  CalculatedCreditPricingFeature,
  CreditPricingFeature,
  CreditPricingOptions,
  CreditPricingResult,
} from './types.ts';
import { divideMoney } from '@pixpilot/cost-calculator';

import {
  compareMoney,
  isZeroMoney,
  roundUpMoney,
  scaleMoney,
  toAtomicUsd,
  toMoney,
} from './money.ts';
import {
  ONE_IN_MICRO_PERCENT,
  ratioToMicroPercent,
  toMicroPercent,
  toPercent,
} from './percentage.ts';
import { creditPricingFeaturesSchema, creditPricingOptionsSchema } from './schemas.ts';

const NO_CREDITS = 0;
const DEFAULT_SAFETY_BUFFER = 0;
const DEFAULT_ENABLED = true;
const HIGHER = 1;

/** A feature costed per credit, before the credit price is known. */
type RatedFeature = Omit<
  CalculatedCreditPricingFeature,
  'isPriceSetting' | 'marginAtCalculatedCreditPrice'
>;

/**
 * Calculates what one credit has to sell for.
 *
 * This is the only calculator in the chain that looks at what we charge.
 * `@pixpilot/cost-calculator` says what an execution costs, an allocation says
 * how many credits that execution consumes, and the two meet here as a cost
 * per credit — the figure a credit's price has to cover.
 *
 * The price is built from the *worst* cost per credit, never the average: a
 * price that only covers the mean loses money on every execution of the
 * feature above it. Averaging is what makes a credit look profitable while the
 * one feature that matters is sold below cost.
 *
 * `creditsPerExecution` is never adjusted here. It is a business decision the
 * administrator owns, and changing it moves only what one credit represents —
 * charging more credits for the same execution lowers the cost each credit
 * carries, and so lowers the price each credit needs.
 */
export function calculateCreditPricing(
  features: CreditPricingFeature[],
  options: CreditPricingOptions,
): CreditPricingResult {
  const validatedFeatures = creditPricingFeaturesSchema.parse(features);
  const {
    roundUpToDecimalPlaces,
    safetyBuffer = DEFAULT_SAFETY_BUFFER,
    targetGrossMargin,
  } = creditPricingOptionsSchema.parse(options);

  const bufferedShare = ONE_IN_MICRO_PERCENT + toMicroPercent(safetyBuffer);
  const revenueShare = ONE_IN_MICRO_PERCENT - toMicroPercent(targetGrossMargin);

  const ratedFeatures = validatedFeatures.map<RatedFeature>((feature) => {
    const providerCostPerExecution = toMoney(feature.providerCostPerExecution);
    const providerCostPerCredit =
      feature.creditsPerExecution > NO_CREDITS
        ? divideByCredits(providerCostPerExecution, feature.creditsPerExecution)
        : null;

    return {
      bufferedProviderCostPerCredit:
        providerCostPerCredit == null
          ? null
          : scaleMoney(providerCostPerCredit, bufferedShare, ONE_IN_MICRO_PERCENT),
      creditsPerExecution: feature.creditsPerExecution,
      enabled: feature.enabled ?? DEFAULT_ENABLED,
      id: feature.id,
      label: feature.label,
      providerCostPerCredit,
      providerCostPerExecution,
    };
  });

  const priceSettingFeature = findPriceSettingFeature(ratedFeatures);
  const bufferedProviderCostPerCredit =
    priceSettingFeature?.bufferedProviderCostPerCredit ?? null;
  const minimumCreditPrice =
    bufferedProviderCostPerCredit == null
      ? null
      : scaleMoney(bufferedProviderCostPerCredit, ONE_IN_MICRO_PERCENT, revenueShare);
  const recommendedCreditPrice =
    minimumCreditPrice == null || roundUpToDecimalPlaces == null
      ? null
      : roundUpMoney(minimumCreditPrice, roundUpToDecimalPlaces);
  const creditPrice = recommendedCreditPrice ?? minimumCreditPrice;

  return {
    bufferedProviderCostPerCredit,
    features: ratedFeatures.map<CalculatedCreditPricingFeature>((feature) => ({
      ...feature,
      isPriceSetting: feature.id === priceSettingFeature?.id,
      marginAtCalculatedCreditPrice: grossMarginPercent(
        feature.providerCostPerCredit,
        creditPrice,
      ),
    })),
    minimumCreditPrice,
    recommendedCreditPrice,
    safetyBuffer,
    targetGrossMargin,
    worstCaseFeatureId: priceSettingFeature?.id ?? null,
    worstCaseProviderCostPerCredit: priceSettingFeature?.providerCostPerCredit ?? null,
  };
}

/**
 * Picks the feature whose credits are the most expensive to honour.
 *
 * Only enabled features that actually charge credits are candidates: a free
 * feature has no cost per credit to compare, and a disabled one is costed for
 * reference without being allowed to raise the price of every credit sold.
 *
 * Ties keep the earlier feature, so the answer does not depend on the order the
 * caller happened to list equally expensive features in.
 */
function findPriceSettingFeature(features: RatedFeature[]): RatedFeature | null {
  return features.reduce<RatedFeature | null>((worst, feature) => {
    if (!feature.enabled || feature.providerCostPerCredit == null) return worst;
    if (worst?.providerCostPerCredit == null) return feature;

    return compareMoney(feature.providerCostPerCredit, worst.providerCostPerCredit) ===
      HIGHER
      ? feature
      : worst;
  }, null);
}

/**
 * Restates what an execution costs as what one of its credits costs.
 *
 * This is the whole reason credits and cost can be reasoned about together:
 * the execution cost never moves, so charging more credits for the same
 * execution simply spreads that cost over more of them.
 */
function divideByCredits(costPerExecution: Money, creditsPerExecution: number): Money {
  return divideMoney(costPerExecution, creditsPerExecution);
}

/**
 * The gross margin a credit earns at a given price: what is left of the price
 * after the cost, as a share of the price.
 *
 * Margin is measured against revenue, not against cost — a 400% markup and an
 * 80% margin are the same price, and confusing the two is what makes a credit
 * look four times more profitable than it is.
 */
function grossMarginPercent(
  providerCostPerCredit: Money | null,
  creditPrice: Money | null,
): number | null {
  if (providerCostPerCredit == null || creditPrice == null) return null;
  if (isZeroMoney(creditPrice)) return null;

  const price = toAtomicUsd(creditPrice);

  return toPercent(
    ratioToMicroPercent(price - toAtomicUsd(providerCostPerCredit), price),
  );
}
