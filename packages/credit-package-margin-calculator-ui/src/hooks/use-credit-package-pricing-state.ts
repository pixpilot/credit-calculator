import type { Dispatch, SetStateAction } from 'react';

import { useCallback, useState } from 'react';

export interface UseCreditPackagePricingStateOptions<TValue> {
  defaultValue: TValue;
  onChange?: ((value: TValue) => void) | undefined;
  value?: TValue | undefined;
}

/**
 * Manages one of the calculator's three editable values in either controlled
 * or self-contained mode.
 *
 * The features, the packages and the assumptions are edited independently — an
 * administrator sweeping a target margin does not disturb a feature's token
 * estimates — so each is held separately rather than merged into one object a
 * host would have to reassemble on every keystroke.
 */
export function useCreditPackagePricingState<TValue>({
  defaultValue,
  onChange,
  value,
}: UseCreditPackagePricingStateOptions<TValue>): {
  update: Dispatch<SetStateAction<TValue>>;
  value: TValue;
} {
  const [uncontrolledValue, setUncontrolledValue] = useState<TValue>(defaultValue);
  const isControlled = value != null;
  const currentValue = value ?? uncontrolledValue;

  const update = useCallback<Dispatch<SetStateAction<TValue>>>(
    (nextValue) => {
      const resolvedValue =
        typeof nextValue === 'function'
          ? (nextValue as (previous: TValue) => TValue)(currentValue)
          : nextValue;

      if (!isControlled) setUncontrolledValue(resolvedValue);
      onChange?.(resolvedValue);
    },
    [currentValue, isControlled, onChange],
  );

  return { update, value: currentValue };
}
