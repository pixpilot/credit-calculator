import type { CalculatedCostPath, Money } from '@pixpilot/cost-calculator';
import type { z } from 'zod';

import type {
  creditAllocationOperationSchema,
  creditPricingScenarioSchema,
} from './schemas.ts';

export type CreditAllocationOperation = z.infer<typeof creditAllocationOperationSchema>;

/** A subscription plan or one-time credit pack the customer can buy. */
export type CreditPricingScenario = z.infer<typeof creditPricingScenarioSchema>;

/**
 * An exact decimal ratio, kept as a string for the same reason `Money` is.
 *
 * A margin is a division result, and rounding one into a float is what makes a
 * reported margin disagree with the revenue and cost it was derived from.
 */
export interface Ratio {
  /** Decimal fraction, so `'0.8'` reads as 80%. */
  value: string;
}

/** One operation's calculated provider cost and credit allocation. */
export interface CalculatedCreditAllocationOperation {
  /** The cost breakdown behind `costPerExecution`, straight from the cost calculator. */
  costPaths: CalculatedCostPath[];
  costPerExecution: Money;
  creditsPerExecution: number;
  id: string;
  label: string;
  /** Provider cost of every selected run of this operation. */
  cost: Money;
  /** Credits issued for every selected run of this operation. */
  credits: number;
  /**
   * Provider execution cost divided by the credits one execution consumes, or
   * `null` when the operation charges no credits and the rate is undefined.
   *
   * An internal accounting rate, not the price a credit sells for: what a
   * credit is worth to the business comes from a pricing scenario.
   */
  providerCostPerCredit: Money | null;
  runs: number;
}

/** The complete, UI-neutral result of calculating a credit allocation. */
export interface CreditAllocationResult {
  operations: CalculatedCreditAllocationOperation[];
  /** Weighted provider cost of one allocated credit, or `null` when none are charged. */
  providerCostPerCredit: Money | null;
  totalCost: Money;
  totalCredits: number;
  totalRuns: number;
}

/** One operation's economics under one pricing scenario. */
export interface CalculatedCreditPricingOperation {
  creditsPerExecution: number;
  /** What one spendable credit is worth under this scenario. */
  effectiveRevenuePerCredit: Money | null;
  /**
   * `grossProfitPerExecution / revenuePerExecution`, or `null` when the
   * scenario produces no revenue to measure the profit against.
   */
  grossMargin: Ratio | null;
  grossProfitPerExecution: Money | null;
  id: string;
  label: string;
  providerCostPerCredit: Money | null;
  providerCostPerExecution: Money;
  revenuePerExecution: Money | null;
  runs: number;
  totalGrossProfit: Money | null;
  totalProviderCost: Money;
  totalRevenue: Money | null;
}

/** A whole allocation read as revenue under one pricing scenario. */
export interface CalculatedCreditPricingScenario {
  /**
   * `packagePrice / spendableCredits`, or `null` when the scenario grants no
   * spendable credits and the rate is undefined.
   */
  effectiveRevenuePerCredit: Money | null;
  grossMargin: Ratio | null;
  operations: CalculatedCreditPricingOperation[];
  /** The scenario these figures were calculated from, as supplied. */
  scenario: CreditPricingScenario;
  /** `includedCredits + bonusCredits` — every credit the price buys. */
  spendableCredits: number;
  totalGrossProfit: Money | null;
  /** The allocation's provider cost, unchanged by any pricing decision. */
  totalProviderCost: Money;
  totalRevenue: Money | null;
}

/** The complete, UI-neutral result of pricing an allocation. */
export interface CreditPricingEconomicsResult {
  /** One entry per supplied scenario, in the order they were supplied. */
  scenarios: CalculatedCreditPricingScenario[];
}
