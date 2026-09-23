import type { Money } from '@pixpilot/cost-calculator';
import type { z } from 'zod';

import type {
  creditPricingFeatureSchema,
  creditPricingOptionsSchema,
} from './schemas.ts';

export type CreditPricingFeature = z.infer<typeof creditPricingFeatureSchema>;
export type CreditPricingOptions = z.infer<typeof creditPricingOptionsSchema>;

/** One feature's provider cost, restated per credit and per the target margin. */
export interface CalculatedCreditPricingFeature {
  /** `providerCostPerCredit` with the safety buffer added, or `null` with it. */
  bufferedProviderCostPerCredit: Money | null;
  creditsPerExecution: number;
  /** A disabled feature is still costed, but never sets the credit price. */
  enabled: boolean;
  id: string;
  /** True for the one feature whose cost the credit price is built from. */
  isPriceSetting: boolean;
  label: string;
  /**
   * The gross margin percentage this feature earns at the credit price this
   * calculation settled on — the recommended price when there is one, and the
   * minimum otherwise. `null` when the feature charges no credits, or when
   * there is no price to measure against.
   */
  marginAtCalculatedCreditPrice: number | null;
  /**
   * What one of this feature's credits costs us, or `null` when the feature
   * charges no credits and the rate is undefined.
   */
  providerCostPerCredit: Money | null;
  providerCostPerExecution: Money;
}

/** The complete, UI-neutral result of pricing one credit. */
export interface CreditPricingResult {
  /** The worst-case cost with the safety buffer added, or `null` with it. */
  bufferedProviderCostPerCredit: Money | null;
  features: CalculatedCreditPricingFeature[];
  /**
   * The least one credit may sell for and still reach the target gross margin,
   * or `null` when no feature charges credits and there is nothing to price.
   */
  minimumCreditPrice: Money | null;
  /**
   * `minimumCreditPrice` rounded up to a cleaner figure, when the caller asked
   * for a rounding; `null` when it did not. Never below the minimum.
   */
  recommendedCreditPrice: Money | null;
  /** The safety buffer this result was calculated with, as a percentage. */
  safetyBuffer: number;
  /** The gross margin this result was calculated for, as a percentage. */
  targetGrossMargin: number;
  /** The id of the feature whose cost per credit set the price, if any. */
  worstCaseFeatureId: string | null;
  /**
   * The highest cost one credit carries across the enabled features that
   * charge credits, or `null` when none of them do.
   */
  worstCaseProviderCostPerCredit: Money | null;
}
