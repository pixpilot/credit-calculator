import type { Money } from '@pixpilot/cost-calculator';

import type { CreditPricingFeature } from './types.ts';

/**
 * What this calculator needs to read from a calculated credit allocation.
 *
 * It is written out structurally rather than imported, so pricing a credit
 * never depends on the allocation package: anything that already knows what an
 * execution costs and how many credits it charges can be priced, and
 * `CreditAllocationResult` happens to be one such thing.
 */
export interface CreditPricingSourceOperation {
  costPerExecution: Money;
  creditsPerExecution: number;
  id: string;
  label: string;
}

/** A calculated allocation, seen only as the operations it priced. */
export interface CreditPricingSource {
  operations: readonly CreditPricingSourceOperation[];
}

/**
 * Turns a calculated credit allocation into the features a credit price is
 * built from.
 *
 * Nothing is recalculated on the way: the allocation's exact per-execution
 * costs and the credits an administrator assigned are carried across as they
 * are, because this calculator's job starts where the allocation's ends.
 */
export function createCreditPricingFeatures(
  source: CreditPricingSource,
): CreditPricingFeature[] {
  return source.operations.map<CreditPricingFeature>((operation) => ({
    creditsPerExecution: operation.creditsPerExecution,
    id: operation.id,
    label: operation.label,
    providerCostPerExecution: operation.costPerExecution,
  }));
}
