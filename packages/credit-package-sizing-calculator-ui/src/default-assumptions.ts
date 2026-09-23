import type { CreditPricingAssumptionsInput } from '@pixpilot/credit-package-sizing-calculator';

/**
 * The pricing strategy the calculator opens on.
 *
 * These are starting points for an argument, not settings the product reads:
 * a credit pack of $5 for 500 credits, a fifth added to the assumed cost as
 * protection, a target margin of 80%, and a subscription that pays 40% more
 * credits for the same price. Everything here is editable on screen, and
 * nothing downstream of this calculator consumes it.
 */
export const DEFAULT_CREDIT_PRICING_ASSUMPTIONS: CreditPricingAssumptionsInput = {
  currentPackageCredits: 500,
  freeCreditsPerWeek: 25,
  inputCostPerMillionTokens: 0.2,
  outputCostPerMillionTokens: 1.2,
  packagePrice: 5,
  safetyBufferPercent: 20,
  subscriptionCreditBonusPercent: 40,
  targetGrossMarginPercent: 80,
};
