import type { CostBatch } from '@pixpilot/cost-calculator';
import type { Dispatch, SetStateAction } from 'react';

import { useCallback, useState } from 'react';
import { createDefaultCostCalculatorBatches } from '../utils/create-default-cost-calculator-batches.ts';

export interface UseCostCalculatorStateOptions {
  defaultValue?: CostBatch[] | undefined;
  onChange?: ((value: CostBatch[]) => void) | undefined;
  value?: CostBatch[] | undefined;
}

/** Manages the calculator in either controlled or self-contained mode. */
export function useCostCalculatorState({
  defaultValue,
  onChange,
  value,
}: UseCostCalculatorStateOptions): {
  update: Dispatch<SetStateAction<CostBatch[]>>;
  value: CostBatch[];
} {
  const [uncontrolledValue, setUncontrolledValue] = useState<CostBatch[]>(
    () => defaultValue ?? createDefaultCostCalculatorBatches(),
  );
  const isControlled = value != null;
  const currentValue = value ?? uncontrolledValue;

  const update = useCallback<Dispatch<SetStateAction<CostBatch[]>>>(
    (nextValue) => {
      const resolvedValue =
        typeof nextValue === 'function' ? nextValue(currentValue) : nextValue;

      if (!isControlled) setUncontrolledValue(resolvedValue);
      onChange?.(resolvedValue);
    },
    [currentValue, isControlled, onChange],
  );

  return { update, value: currentValue };
}
