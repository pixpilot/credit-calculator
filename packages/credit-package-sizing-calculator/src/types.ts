import type { Money } from '@pixpilot/cost-calculator';
import type { z } from 'zod';

import type {
  creditPricingAssumptionsSchema,
  creditPricingFeatureSchema,
} from './schemas.ts';

/**
 * One feature as a caller supplies it.
 *
 * Everything but the name is optional so an existing scenario list — the same
 * shape the admin cost calculators are already fed — can be handed straight to
 * this calculator without being restated.
 */
export type CreditPricingFeatureInput = z.input<typeof creditPricingFeatureSchema>;

/** Everything the features are priced against, as a caller supplies it. */
export type CreditPricingAssumptionsInput = z.input<
  typeof creditPricingAssumptionsSchema
>;

/** The same assumptions with every optional figure resolved to a value. */
export type CreditPricingAssumptions = z.output<typeof creditPricingAssumptionsSchema>;

/** One feature after normalisation: every figure present, and identity settled. */
export interface CreditPricingFeature {
  creditsPerExecution: number;
  fixedCostName?: string | undefined;
  fixedCostPerExecution: number;
  /** Stable row identity, so editing a name never re-keys the table. */
  id: string;
  inputTokens: number;
  name: string;
  outputTokens: number;
  quantity: number;
}

/** How a margin compares to the target an administrator set. */
export type MarginStatus = 'acceptable' | 'below-target' | 'healthy' | 'unknown';

/** One feature costed per execution, per credit, and over its expected runs. */
export interface CalculatedCreditPricingFeature {
  costPerCredit: Money;
  costPerExecution: Money;
  creditsPerExecution: number;
  fixedCostName: string | null;
  fixedCostPerExecution: Money;
  id: string;
  inputCostPerExecution: Money;
  inputTokens: number;
  /** True for the feature whose cost per credit is the least efficient. */
  isWorstCase: boolean;
  name: string;
  outputCostPerExecution: Money;
  outputTokens: number;
  quantity: number;
  totalCost: Money;
  totalCredits: number;
}

/**
 * The expected usage distribution, read as what a credit costs.
 *
 * The weighted average and the worst case are kept apart deliberately: the
 * average is what the business expects to pay, and the worst case is what it
 * pays if every credit is spent on the least efficient feature. A price built
 * on the average alone loses money exactly when a user finds the feature that
 * costs the most.
 */
export interface CreditUsageMix {
  bufferedWeightedAverageCostPerCredit: Money | null;
  bufferedWorstCaseCostPerCredit: Money | null;
  expectedTotalCost: Money;
  expectedTotalCredits: number;
  features: CalculatedCreditPricingFeature[];
  safetyBufferPercent: number;
  weightedAverageCostPerCredit: Money | null;
  worstCaseCostPerCredit: Money | null;
  worstCaseFeatureId: string | null;
}

/** What one package of credits earns, expected and worst case. */
export interface CreditPackageEconomics {
  /** The worst-case cost with the safety buffer added. */
  bufferedWorstCaseCost: Money | null;
  bufferedWorstCaseGrossMarginPercent: number | null;
  bufferedWorstCaseMarginStatus: MarginStatus;
  credits: number;
  expectedCost: Money | null;
  expectedGrossMarginPercent: number | null;
  expectedMarginStatus: MarginStatus;
  expectedProfit: Money | null;
  expectedProfitPerCredit: Money | null;
  price: Money;
  revenuePerCredit: Money | null;
  /** The package read as the number of standard AI actions it buys. */
  standardActions: number | null;
  worstCaseCost: Money | null;
  worstCaseGrossMarginPercent: number | null;
  worstCaseMarginStatus: MarginStatus;
  worstCaseProfit: Money | null;
  worstCaseProfitPerCredit: Money | null;
}

/** The most credits a package price may include and still hold the target. */
export interface CreditPricingLimits {
  /** What the target margin leaves for cost of goods sold. */
  allowedCogs: Money;
  /**
   * The limit if every credit were spent on the least efficient feature. This
   * is the only one of the two that is a guarantee.
   */
  worstCaseSafeCredits: number | null;
  /**
   * The limit at the expected usage mix. Higher, and not guaranteed: it holds
   * only while users keep spending credits the way this table assumes.
   */
  expectedMixSafeCredits: number | null;
}

/** A package size worth actually selling, with the reasoning kept visible. */
export interface SuggestedCreditPackage {
  credits: number;
  /** The conservative limit the suggestion was rounded down from. */
  conservativeCredits: number | null;
  economics: CreditPackageEconomics;
  /**
   * True when the current package already sits inside the conservative limit,
   * so there is nothing to change.
   */
  isCurrentPackageComfortable: boolean;
}

/** The subscription that offers more credits for the same nominal price. */
export interface CreditSubscriptionRecommendation {
  bonusPercent: number;
  credits: number;
  economics: CreditPackageEconomics;
  /** True when the bonus credits break the target margin once buffered. */
  violatesTargetMargin: boolean;
}

/** What the free weekly allowance costs, kept out of the paid margins. */
export interface FreeCreditAnalysis {
  creditsPerWeek: number;
  /** Expected cost of a month of free credits, at the weighted average. */
  expectedMonthlyCost: Money | null;
  monthlyCredits: number;
  standardActionsPerWeek: number | null;
}

/** One package size in the side-by-side comparison. */
export interface CreditPackageScenario {
  economics: CreditPackageEconomics;
  /** True when this scenario is the package currently being sold. */
  isCurrent: boolean;
}

/** Everything the calculator has to say about one set of inputs. */
export interface CreditPricingSummary {
  assumptions: CreditPricingAssumptions;
  currentPackage: CreditPackageEconomics;
  freeTier: FreeCreditAnalysis;
  limits: CreditPricingLimits;
  mix: CreditUsageMix;
  scenarios: CreditPackageScenario[];
  subscription: CreditSubscriptionRecommendation;
  suggestedPackage: SuggestedCreditPackage;
}
