import type { z } from 'zod';

import type {
  costBatchSchema,
  costPathSchema,
  fixedCostPathSchema,
  modelPricingSchema,
  tokenCostPathSchema,
} from './schemas.ts';

/** A decimal USD amount that has not been rounded through JavaScript numbers. */
export interface Money {
  amount: string;
  currency: 'USD';
}

export type CostBatch = z.infer<typeof costBatchSchema>;
export type CostPath = z.infer<typeof costPathSchema>;
export type FixedCostPath = z.infer<typeof fixedCostPathSchema>;
export type ModelPricing = z.infer<typeof modelPricingSchema>;
export type TokenCostPath = z.infer<typeof tokenCostPathSchema>;

export interface CalculatedTokenCostPath {
  costPerExecution: Money;
  inputCost: Money;
  inputTokens: number;
  modelMetadata?: Record<string, unknown> | undefined;
  name: string;
  outputCost: Money;
  outputTokens: number;
  totalCost: Money;
  type: 'tokens';
}

export interface CalculatedFixedCostPath {
  costPerExecution: Money;
  name: string;
  totalCost: Money;
  type: 'fixed';
}

export type CalculatedCostPath = CalculatedFixedCostPath | CalculatedTokenCostPath;

export interface CalculatedCostBatch {
  costPerExecution: Money;
  name: string;
  paths: CalculatedCostPath[];
  quantity: number;
  totalCost: Money;
}

export interface CostCalculatorResult {
  batches: CalculatedCostBatch[];
  grandTotal: Money;
}
