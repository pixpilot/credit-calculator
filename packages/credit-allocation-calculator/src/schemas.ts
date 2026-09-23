import { costPathSchema } from '@pixpilot/cost-calculator';
import { z } from 'zod';

const MAX_CREDITS_PER_EXECUTION = 1_000_000;
const MAX_RUNS = 1_000_000;
const MAX_NAME_LENGTH = 256;

const nonEmptyNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

/**
 * Runtime schema for the credits an administrator decides one execution
 * should consume. Zero models an operation that is deliberately free.
 */
export const creditsPerExecutionSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_CREDITS_PER_EXECUTION)
  .safe();

/** Runtime schema for the number of times an operation will run. */
export const runsSchema = z.number().int().nonnegative().max(MAX_RUNS).safe();

/** Runtime schema for one configurable, credit-charged operation. */
export const creditAllocationOperationSchema = z.object({
  creditsPerExecution: creditsPerExecutionSchema,
  id: nonEmptyNameSchema,
  label: nonEmptyNameSchema,
  paths: z.array(costPathSchema).min(1),
  runs: runsSchema,
});

/** Runtime schema for the operations in a complete credit allocation. */
export const creditAllocationOperationsSchema = z
  .array(creditAllocationOperationSchema)
  .min(1)
  .superRefine((operations, context) => {
    const seenIds = new Set<string>();

    operations.forEach((operation, operationIndex) => {
      if (seenIds.has(operation.id)) {
        context.addIssue({
          code: 'custom',
          message: `Operation id "${operation.id}" must be unique`,
          path: [operationIndex, 'id'],
        });
      }
      seenIds.add(operation.id);
    });
  });

const MAX_SCENARIO_CREDITS = 1_000_000_000;
const EXACT_DECIMAL_AMOUNT = /^\d+(?:\.\d+)?$/u;

/**
 * Runtime schema for an exact, non-negative USD amount.
 *
 * Prices arrive as the same decimal strings the cost calculator produces, so
 * no price is rounded through a float on its way into the arithmetic.
 */
export const usdAmountSchema = z.object({
  amount: z
    .string()
    .regex(EXACT_DECIMAL_AMOUNT, 'Amount must be a non-negative decimal, e.g. "19.99"'),
  currency: z.literal('USD'),
});

/** Runtime schema for a count of credits a pricing scenario grants. */
export const scenarioCreditsSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MAX_SCENARIO_CREDITS)
  .safe();

/**
 * Runtime schema for one subscription plan or one-time credit pack.
 *
 * The price and the credits it buys are the source of truth; the revenue one
 * credit represents is derived from them rather than supplied alongside them,
 * so the two can never drift apart.
 */
export const creditPricingScenarioSchema = z.object({
  /** Promotional credits granted on top of the included allowance. */
  bonusCredits: scenarioCreditsSchema.optional(),
  id: nonEmptyNameSchema,
  /** Credits the scenario includes or sells at its price. */
  includedCredits: scenarioCreditsSchema,
  label: nonEmptyNameSchema,
  packagePrice: usdAmountSchema,
});

/** Runtime schema for the scenarios an allocation is priced against. */
export const creditPricingScenariosSchema = z
  .array(creditPricingScenarioSchema)
  .superRefine((scenarios, context) => {
    const seenIds = new Set<string>();

    scenarios.forEach((scenario, scenarioIndex) => {
      if (seenIds.has(scenario.id)) {
        context.addIssue({
          code: 'custom',
          message: `Pricing scenario id "${scenario.id}" must be unique`,
          path: [scenarioIndex, 'id'],
        });
      }
      seenIds.add(scenario.id);
    });
  });
