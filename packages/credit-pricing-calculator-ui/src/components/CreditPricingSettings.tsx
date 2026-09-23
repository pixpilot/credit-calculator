'use client';

import type { CreditPricingOptions } from '@pixpilot/credit-pricing-calculator';
import type { ReactNode } from 'react';

import {
  safetyBufferSchema,
  targetGrossMarginSchema,
} from '@pixpilot/credit-pricing-calculator';
import { Input } from '@pixpilot/shadcn-ui';
import { useId } from 'react';

const PERCENT_STEP = 0.5;
const MINIMUM_PERCENT = 0;
const DEFAULT_SAFETY_BUFFER = 0;

export interface CreditPricingSettingsProps {
  options: CreditPricingOptions;
  onChange: (options: CreditPricingOptions) => void;
}

/**
 * The two figures that turn a provider cost into a selling price.
 *
 * Both are validated by the calculator's own schemas before they are reported,
 * so a half-typed `1e` or a pasted `120` never reaches a calculation that
 * throws on it — and a 100% gross margin, which no price satisfies, is
 * rejected at the keystroke rather than as a divide by zero.
 */
export function CreditPricingSettings({
  onChange,
  options,
}: CreditPricingSettingsProps): ReactNode {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <PercentField
        label="Target gross margin"
        value={options.targetGrossMargin}
        onChange={(targetGrossMargin) => {
          if (targetGrossMarginSchema.safeParse(targetGrossMargin).success) {
            onChange({ ...options, targetGrossMargin });
          }
        }}
      />
      <PercentField
        label="Safety buffer"
        value={options.safetyBuffer ?? DEFAULT_SAFETY_BUFFER}
        onChange={(safetyBuffer) => {
          if (safetyBufferSchema.safeParse(safetyBuffer).success) {
            onChange({ ...options, safetyBuffer });
          }
        }}
      />
    </div>
  );
}

function PercentField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: number) => void;
  value: number;
}): ReactNode {
  const inputId = useId();

  return (
    <div className="flex items-center gap-2 text-xs">
      <label className="text-muted-foreground" htmlFor={inputId}>
        {label}
      </label>
      <span className="flex items-baseline gap-1">
        <Input
          className="h-7 w-20 text-right font-mono tabular-nums"
          id={inputId}
          min={MINIMUM_PERCENT}
          step={PERCENT_STEP}
          type="number"
          value={value}
          onChange={(event) => {
            if (event.target.value !== '') onChange(Number(event.target.value));
          }}
        />
        <span className="text-muted-foreground">%</span>
      </span>
    </div>
  );
}
