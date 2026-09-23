import type { CostBatch } from '@pixpilot/cost-calculator';

/** A valid starting point for an uncontrolled cost calculator. */
export function createDefaultCostCalculatorBatches(): CostBatch[] {
  return [
    {
      name: 'New operation',
      paths: [
        {
          costPerExecution: 0,
          name: 'Fixed cost',
          type: 'fixed',
        },
      ],
      quantity: 1,
    },
  ];
}
