'use client';

import type { CalculatedCostPath } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { Input, Label } from '@pixpilot/shadcn';
import { formatUsd } from '../utils/format-usd.ts';
import { CostDetails } from './CostDetails.tsx';

export interface FixedCostFieldsProps {
  costPerExecution: number;
  pathName: string;
  result: CalculatedCostPath;
  onChange: (value: string) => void;
}

/** Edits the unit price for a fixed-cost path and shows its core-calculated total. */
export function FixedCostFields({
  costPerExecution,
  pathName,
  result,
  onChange,
}: FixedCostFieldsProps): ReactNode {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor={`fixed-cost-${pathName}`}>Cost / execution</Label>
        <Input
          id={`fixed-cost-${pathName}`}
          min="0"
          step="any"
          type="number"
          value={costPerExecution}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <CostDetails rows={[['Path total', formatUsd(result.costPerExecution)]]} />
    </div>
  );
}
