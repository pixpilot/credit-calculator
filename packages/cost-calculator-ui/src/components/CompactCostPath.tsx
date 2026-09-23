'use client';

import type { CalculatedCostPath, CostPath } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { formatUsd } from '../utils/format-usd.ts';
import { NumberSlider } from './NumberSlider.tsx';

const MAX_ESTIMATED_TOKENS = 20_000;
const TOKEN_SLIDER_STEP = 100;
const MAX_FIXED_COST = 0.05;
const FIXED_COST_SLIDER_STEP = 0.001;

export interface CompactCostPathProps {
  path: CostPath;
  result: CalculatedCostPath;
  onChange: (path: CostPath) => void;
}

/** Compact controls for one fixed or token-priced path in an admin cost batch. */
export function CompactCostPath({
  path,
  result,
  onChange,
}: CompactCostPathProps): ReactNode {
  if (path.type === 'fixed') {
    return (
      <NumberSlider
        label={`${path.name} cost`}
        max={MAX_FIXED_COST}
        min={0}
        step={FIXED_COST_SLIDER_STEP}
        value={path.costPerExecution}
        valueLabel={formatUsd(result.costPerExecution)}
        onChange={(costPerExecution) => onChange({ ...path, costPerExecution })}
      />
    );
  }

  if (result.type !== 'tokens') return null;

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <NumberSlider
          label={`${path.name} input`}
          max={MAX_ESTIMATED_TOKENS}
          min={0}
          step={TOKEN_SLIDER_STEP}
          value={path.inputTokens}
          valueLabel={path.inputTokens.toLocaleString()}
          onChange={(inputTokens) => onChange({ ...path, inputTokens })}
        />
        <NumberSlider
          label={`${path.name} output`}
          max={MAX_ESTIMATED_TOKENS}
          min={0}
          step={TOKEN_SLIDER_STEP}
          value={path.outputTokens}
          valueLabel={path.outputTokens.toLocaleString()}
          onChange={(outputTokens) => onChange({ ...path, outputTokens })}
        />
      </div>
    </div>
  );
}
