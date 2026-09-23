import type {
  CalculatedCostBatch,
  CalculatedCostPath,
  CostBatch,
  CostCalculatorResult,
  ModelPricing,
} from './types.ts';
import {
  atomicToMoney,
  multiplyAtomic,
  tokenCostToAtomic,
  usdNumberToAtomic,
} from './money.ts';
import { costBatchesSchema, modelPricingSchema } from './schemas.ts';

const ZERO_ATOMIC_USD = 0n;

/** Calculates exact USD costs for every batch at one model's token rates. */
export function calculateCost(
  input: CostBatch[],
  model: ModelPricing,
): CostCalculatorResult {
  const validatedBatches = costBatchesSchema.parse(input);
  const validatedModel = modelPricingSchema.parse(model);
  const batches = validatedBatches.map((batch) => calculateBatch(batch, validatedModel));
  const grandTotal = batches.reduce(
    (total, batch) => total + batch.totalAtomic,
    ZERO_ATOMIC_USD,
  );

  return {
    batches: batches.map(({ totalAtomic: _totalAtomic, ...batch }) => batch),
    grandTotal: atomicToMoney(grandTotal),
  };
}

function calculateBatch(
  batch: CostBatch,
  model: ModelPricing,
): CalculatedCostBatch & { totalAtomic: bigint } {
  let costPerExecutionAtomic = ZERO_ATOMIC_USD;
  const paths: CalculatedCostPath[] = [];

  for (const path of batch.paths) {
    const calculatedPath = calculatePath(path, batch.quantity, model);
    costPerExecutionAtomic += calculatedPath.costPerExecutionAtomic;
    paths.push(calculatedPath.path);
  }

  const totalAtomic = multiplyAtomic(costPerExecutionAtomic, batch.quantity);

  return {
    costPerExecution: atomicToMoney(costPerExecutionAtomic),
    name: batch.name,
    paths,
    quantity: batch.quantity,
    totalAtomic,
    totalCost: atomicToMoney(totalAtomic),
  };
}

function calculatePath(
  path: CostBatch['paths'][number],
  quantity: number,
  model: ModelPricing,
): { costPerExecutionAtomic: bigint; path: CalculatedCostPath } {
  if (path.type === 'fixed') {
    const costPerExecutionAtomic = usdNumberToAtomic(path.costPerExecution);

    return {
      costPerExecutionAtomic,
      path: {
        costPerExecution: atomicToMoney(costPerExecutionAtomic),
        name: path.name,
        totalCost: atomicToMoney(multiplyAtomic(costPerExecutionAtomic, quantity)),
        type: 'fixed',
      },
    };
  }

  const inputCostAtomic = tokenCostToAtomic(
    model.inputPricePerMillionTokens,
    path.inputTokens,
  );
  const outputCostAtomic = tokenCostToAtomic(
    model.outputPricePerMillionTokens,
    path.outputTokens,
  );
  const costPerExecutionAtomic = inputCostAtomic + outputCostAtomic;

  return {
    costPerExecutionAtomic,
    path: {
      costPerExecution: atomicToMoney(costPerExecutionAtomic),
      inputCost: atomicToMoney(inputCostAtomic),
      inputTokens: path.inputTokens,
      modelMetadata: model.metadata,
      name: path.name,
      outputCost: atomicToMoney(outputCostAtomic),
      outputTokens: path.outputTokens,
      totalCost: atomicToMoney(multiplyAtomic(costPerExecutionAtomic, quantity)),
      type: 'tokens',
    },
  };
}
