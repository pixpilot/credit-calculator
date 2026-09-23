'use client';

import type { ReactNode } from 'react';

import { Slider } from '@pixpilot/shadcn-ui';

export interface NumberSliderProps {
  label: string;
  max: number;
  min: number;
  step: number;
  value: number;
  valueLabel: string;
  onChange: (value: number) => void;
}

/** A compact numeric slider that keeps its current value visible while editing. */
export function NumberSlider({
  label,
  max,
  min,
  onChange,
  step,
  value,
  valueLabel,
}: NumberSliderProps): ReactNode {
  const maximum = Math.max(max, value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">{label}</span>
        <output className="font-mono tabular-nums">{valueLabel}</output>
      </div>
      <Slider
        aria-label={label}
        max={maximum}
        min={min}
        step={step}
        value={[value]}
        onValueChange={([nextValue]) => {
          if (nextValue != null) onChange(nextValue);
        }}
      />
    </div>
  );
}
