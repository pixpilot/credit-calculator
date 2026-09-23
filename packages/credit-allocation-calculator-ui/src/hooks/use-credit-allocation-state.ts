import type { CreditAllocationOperation } from '@pixpilot/credit-allocation-calculator';
import type { Dispatch, SetStateAction } from 'react';

import { useCallback, useState } from 'react';

export interface UseCreditAllocationStateOptions {
  defaultValue: CreditAllocationOperation[];
  onChange?: ((value: CreditAllocationOperation[]) => void) | undefined;
  value?: CreditAllocationOperation[] | undefined;
}

/** Manages the allocation in either controlled or self-contained mode. */
export function useCreditAllocationState({
  defaultValue,
  onChange,
  value,
}: UseCreditAllocationStateOptions): {
  update: Dispatch<SetStateAction<CreditAllocationOperation[]>>;
  value: CreditAllocationOperation[];
} {
  const [uncontrolledValue, setUncontrolledValue] =
    useState<CreditAllocationOperation[]>(defaultValue);
  const isControlled = value != null;
  const currentValue = value ?? uncontrolledValue;

  const update = useCallback<Dispatch<SetStateAction<CreditAllocationOperation[]>>>(
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
