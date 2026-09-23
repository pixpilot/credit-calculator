import type { CalculatedCostPath, ModelPricing } from '@pixpilot/cost-calculator';

import type {
  CalculatedCreditAllocationOperation,
  CreditAllocationOperation,
  CreditAllocationResult,
} from './types.ts';
import {
  calculateCost,
  divideMoney,
  multiplyMoney,
  sumMoney,
} from '@pixpilot/cost-calculator';

import { creditAllocationOperationsSchema } from './schemas.ts';

const SINGLE_EXECUTION = 1;
const NO_CREDITS = 0;
const NO_RUNS = 0;

/**
 * Calculates a credit allocation for the chosen number of operation runs.
 *
 * Provider execution cost is never inferred from credits: it is calculated by
 * `@pixpilot/cost-calculator` from the operation's own paths and model
 * pricing, and credits are the allocation an administrator lays on top. The
 * two only meet in the derived provider-cost-per-credit rates.
 *
 * What those credits are worth to the business is deliberately not calculated
 * here — that depends on the plan or credit pack the customer bought, and is
 * `calculateCreditPricingEconomics`'s job, downstream of this result.
 *
 * Everything is scaled from a single one-execution pricing pass, so a path
 * total, an operation total, and the grand total can never disagree: each is
 * the one before it multiplied or added in exact `bigint` units.
 */
export function calculateCreditAllocation(
  operations: CreditAllocationOperation[],
  model: ModelPricing,
): CreditAllocationResult {
  const validatedOperations = creditAllocationOperationsSchema.parse(operations);
  const perExecution = calculateCost(
    validatedOperations.map((operation) => ({
      name: operation.id,
      paths: operation.paths,
      quantity: SINGLE_EXECUTION,
    })),
    model,
  );

  const calculatedOperations =
    validatedOperations.map<CalculatedCreditAllocationOperation>((operation, index) => {
      const { costPerExecution, paths } = perExecution.batches[index]!;

      return {
        costPaths: paths.map((path) => toRunTotalPath(path, operation.runs)),
        providerCostPerCredit:
          operation.creditsPerExecution > NO_CREDITS
            ? divideMoney(costPerExecution, operation.creditsPerExecution)
            : null,
        costPerExecution,
        creditsPerExecution: operation.creditsPerExecution,
        id: operation.id,
        label: operation.label,
        cost: multiplyMoney(costPerExecution, operation.runs),
        credits: operation.runs * operation.creditsPerExecution,
        runs: operation.runs,
      };
    });

  const totalCost = sumMoney(calculatedOperations.map((operation) => operation.cost));
  const totalCredits = calculatedOperations.reduce(
    (total, operation) => total + operation.credits,
    NO_CREDITS,
  );

  return {
    providerCostPerCredit:
      totalCredits > NO_CREDITS ? divideMoney(totalCost, totalCredits) : null,
    operations: calculatedOperations,
    totalCost,
    totalCredits,
    totalRuns: validatedOperations.reduce(
      (total, operation) => total + operation.runs,
      NO_RUNS,
    ),
  };
}

/**
 * Restates a path priced for one execution as the cost of every selected run.
 *
 * The cost calculator prices the allocation a single execution at a time so
 * that an operation with no runs still shows what one would cost; without this
 * the breakdown behind a row would report one run's cost as the row's total.
 */
function toRunTotalPath(path: CalculatedCostPath, runs: number): CalculatedCostPath {
  const totalCost = multiplyMoney(path.costPerExecution, runs);

  return path.type === 'fixed' ? { ...path, totalCost } : { ...path, totalCost };
}
