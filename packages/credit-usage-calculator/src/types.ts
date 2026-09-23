/** A configurable credit-backed action available to a user. */
export interface CreditFeature {
  id: string;
  label: string;
  description?: string | undefined;
  creditCost: number;
}

/** A user's selected quantity for one configured feature. */
export interface CreditUsage {
  featureId: string;
  quantity: number;
}

/** The configuration shared by every calculator operation. */
export interface CreditCalculatorConfig {
  credits: number;
  features: readonly CreditFeature[];
}

/** A calculator configuration together with optional selected quantities. */
export interface CreditUsageCalculationInput extends CreditCalculatorConfig {
  usage?: readonly CreditUsage[] | undefined;
}

/** Presentation-ready usage details for a configured feature. */
export interface CalculatedCreditFeature extends CreditFeature {
  quantity: number;
  usedCredits: number;
  maxQuantityFromTotal: number;
  maxQuantityFromRemaining: number;
}

/** What a credit balance can buy for one feature. */
export interface CreditEquivalent {
  featureId: string;
  label: string;
  description?: string | undefined;
  creditCost: number;
  quantity: number;
}

/** The complete, UI-neutral result of calculating selected credit usage. */
export interface CreditUsageResult {
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  isWithinBudget: boolean;
  overBudgetCredits: number;
  features: readonly CalculatedCreditFeature[];
  equivalents: readonly CreditEquivalent[];
}

/** Input for calculating a single selected feature in isolation. */
export interface SingleFeatureCreditUsageInput extends CreditCalculatorConfig {
  featureId: string;
  quantity: number;
}

/** A complete result with the selected feature identified explicitly. */
export interface SingleFeatureCreditUsageResult extends CreditUsageResult {
  selectedFeatureId: string;
  selectedFeature: CalculatedCreditFeature;
}
