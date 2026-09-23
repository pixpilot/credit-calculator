'use client';

import type { CalculatedTokenCostPath, TokenCostPath } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { Input, Label } from '@pixpilot/shadcn';
import { formatUsd } from '../utils/format-usd.ts';
import { CostDetails } from './CostDetails.tsx';

export interface TokenCostFieldsProps {
  path: TokenCostPath;
  result: CalculatedTokenCostPath;
  onNumberChange: (key: 'inputTokens' | 'outputTokens', value: string) => void;
}

/** Edits an AI token path and renders its core-calculated input and output costs. */
export function TokenCostFields({
  path,
  result,
  onNumberChange,
}: TokenCostFieldsProps): ReactNode {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={`input-tokens-${path.name}`}>Input tokens</Label>
        <Input
          id={`input-tokens-${path.name}`}
          min="0"
          step="1"
          type="number"
          value={path.inputTokens}
          onChange={(event) => onNumberChange('inputTokens', event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`output-tokens-${path.name}`}>Output tokens</Label>
        <Input
          id={`output-tokens-${path.name}`}
          min="0"
          step="1"
          type="number"
          value={path.outputTokens}
          onChange={(event) => onNumberChange('outputTokens', event.target.value)}
        />
      </div>
      <CostDetails
        rows={[
          ['Input cost', formatUsd(result.inputCost)],
          ['Output cost', formatUsd(result.outputCost)],
          ['Path total', formatUsd(result.costPerExecution)],
        ]}
      />
    </div>
  );
}
