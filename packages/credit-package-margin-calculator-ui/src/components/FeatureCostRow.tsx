'use client';

import type {
  CalculatedFeatureRow,
  FeatureRow,
} from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import {
  MAX_CREDITS,
  MAX_QUANTITY,
  MAX_TOKENS,
  MAX_USD_AMOUNT,
} from '@pixpilot/credit-package-margin-calculator';
import { Button, cn } from '@pixpilot/shadcn';
import { X } from 'lucide-react';
import { formatCount, formatUnitUsd, formatUsd } from '../utils/format-number.ts';
import { NumericCell } from './NumericCell.tsx';
import { TextCell } from './TextCell.tsx';

const FIXED_COST_STEP = 0.000001;

export interface FeatureCostRowProps {
  row: CalculatedFeatureRow;
  onChange: (changes: Partial<FeatureRow>) => void;
  onRemove: () => void;
}

/**
 * One feature: its estimates on the left, what they cost on the right.
 *
 * The row that drives the worst-case cost per credit is marked, because it is
 * the one every package on the screen is stress-tested against — changing it
 * moves every worst-case margin below.
 */
export function FeatureCostRow({
  onChange,
  onRemove,
  row,
}: FeatureCostRowProps): ReactNode {
  const { feature } = row;

  return (
    <tr
      className={cn(
        'border-border/60 border-t',
        row.isWorstCase && 'bg-red-500/10 -outline-offset-1 outline-red-500/40',
      )}
    >
      <td className="py-1 pr-2 pl-3">
        <TextCell
          className="w-40 min-w-40"
          label={`Name for ${feature.name}`}
          value={feature.name}
          onCommit={(name) => {
            onChange({ name });
          }}
        />
      </td>

      <NumericTd>
        <NumericCell
          integer
          label={`Credits per run for ${feature.name}`}
          maximum={MAX_CREDITS}
          value={feature.creditCost}
          onCommit={(creditCost) => {
            onChange({ creditCost });
          }}
        />
      </NumericTd>

      <NumericTd>
        <NumericCell
          integer
          label={`Input tokens for ${feature.name}`}
          maximum={MAX_TOKENS}
          value={feature.inputTokens}
          onCommit={(inputTokens) => {
            onChange({ inputTokens });
          }}
        />
      </NumericTd>

      <NumericTd>
        <NumericCell
          integer
          label={`Output tokens for ${feature.name}`}
          maximum={MAX_TOKENS}
          value={feature.outputTokens}
          onCommit={(outputTokens) => {
            onChange({ outputTokens });
          }}
        />
      </NumericTd>

      <NumericTd>
        <NumericCell
          label={`Fixed cost for ${feature.name}`}
          maximum={MAX_USD_AMOUNT}
          step={FIXED_COST_STEP}
          value={feature.fixedCost}
          onCommit={(fixedCost) => {
            onChange({ fixedCost });
          }}
        />
      </NumericTd>

      <NumericTd>
        <NumericCell
          integer
          label={`Runs a month for ${feature.name}`}
          maximum={MAX_QUANTITY}
          value={feature.quantity}
          onCommit={(quantity) => {
            onChange({ quantity });
          }}
        />
      </NumericTd>

      <ReadoutTd>{formatUnitUsd(row.variableCost)}</ReadoutTd>
      <ReadoutTd className={cn(row.isWorstCase && 'text-red-400')}>
        {formatUnitUsd(row.costPerCredit)}
        {row.isWorstCase && (
          <span className="text-muted-foreground ml-1 text-[0.625rem]">worst</span>
        )}
      </ReadoutTd>
      <ReadoutTd>{formatUsd(row.totalCost)}</ReadoutTd>
      <ReadoutTd>{formatCount(row.totalCredits)}</ReadoutTd>

      <td className="py-1 pr-2 pl-1">
        <Button
          aria-label={`Remove ${feature.name}`}
          className="size-7 rounded-none"
          size="icon"
          type="button"
          variant="ghost"
          onClick={onRemove}
        >
          <X className="size-3.5" />
        </Button>
      </td>
    </tr>
  );
}

function NumericTd({ children }: { children: ReactNode }): ReactNode {
  return <td className="w-24 py-1 pr-2">{children}</td>;
}

function ReadoutTd({
  children,
  className,
}: {
  children: ReactNode;
  className?: string | undefined;
}): ReactNode {
  return (
    <td
      className={cn(
        'py-1 pr-3 text-right font-mono text-xs whitespace-nowrap tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  );
}
