import type { Dispatch, SetStateAction } from 'react';

import { useCallback, useState } from 'react';

export interface UseCreditPricingValueOptions<TValue> {
  defaultValue: TValue;
  onChange?: ((value: TValue) => void) | undefined;
  value?: TValue | undefined;
}

/**
 * Manages one of the calculator's editable values in either controlled or
 * self-contained mode.
 *
 * The feature table and the assumptions are edited independently — an
 * administrator sweeps a target margin without touching a feature, and the
 * other way round — so each is held separately rather than merged into one
 * object a host would have to reassemble on every keystroke.
 */
export function useCreditPricingValue<TValue>({
  defaultValue,
  onChange,
  value,
}: UseCreditPricingValueOptions<TValue>): {
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
