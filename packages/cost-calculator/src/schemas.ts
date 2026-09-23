import { z } from 'zod';

const MAX_USD_AMOUNT = 1_000_000_000;
const MAX_NAME_LENGTH = 256;

const nonNegativeAmountSchema = z
  .number()
  .finite()
  .nonnegative()
  .max(MAX_USD_AMOUNT, `Amounts must not exceed ${MAX_USD_AMOUNT} USD`);

const nonEmptyNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

/** Runtime schema for the one model that prices a calculator session. */
export const modelPricingSchema = z.object({
  inputPricePerMillionTokens: nonNegativeAmountSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
  outputPricePerMillionTokens: nonNegativeAmountSchema,
});

/** Runtime schema for a token-priced operation within a batch. */
export const tokenCostPathSchema = z.object({
  inputTokens: z.number().int().nonnegative().safe(),
  name: nonEmptyNameSchema,
  outputTokens: z.number().int().nonnegative().safe(),
  type: z.literal('tokens'),
});

/** Runtime schema for a fixed per-execution operation within a batch. */
export const fixedCostPathSchema = z.object({
  costPerExecution: nonNegativeAmountSchema,
  name: nonEmptyNameSchema,
  type: z.literal('fixed'),
});

/** Discriminated path union that can be extended with future cost types. */
export const costPathSchema = z.discriminatedUnion('type', [
  tokenCostPathSchema,
  fixedCostPathSchema,
]);

/** Runtime schema for one named, repeated product operation. */
export const costBatchSchema = z.object({
  name: nonEmptyNameSchema,
  paths: z.array(costPathSchema).min(1),
  quantity: z.number().int().positive().safe(),
});

/** Runtime schema for the batches in a complete cost-calculator request. */
export const costBatchesSchema = z.array(costBatchSchema).min(1);
