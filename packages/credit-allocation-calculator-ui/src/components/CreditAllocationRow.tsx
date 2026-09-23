'use client';

import type {
  CalculatedCreditAllocationOperation,
  CalculatedCreditPricingOperation,
} from '@pixpilot/credit-allocation-calculator';
import type { ReactNode } from 'react';

import { Input, SliderInput } from '@pixpilot/shadcn-ui';
import { formatPercent, formatUnitUsd, formatUsd } from '../utils/format-money.ts';

/** What the table shows where a figure is undefined, as the money helpers do. */
const ABSENT = '—';
const CREDITS_STEP = 1;
const RUNS_STEP = 1;
const MINIMUM_VALUE = 0;

export interface CreditAllocationRowProps {
  maxCreditsPerExecution: number;
  maxRuns: number;
  operation: CalculatedCreditAllocationOperation;
  /** What this operation earns under the selected scenario, if any is. */
  pricing?: CalculatedCreditPricingOperation | undefined;
  onCreditsChange: (creditsPerExecution: number) => void;
  onRunsChange: (runs: number) => void;
}

/**
 * One operation: its run and credit controls plus every figure they produce.
 *
 * The row is the editor and the result at once, so an administrator never has
 * to scroll between a slider and the number it moved.
 *
 * Both controls report only values the calculator accepts — whole numbers
 * inside their own bounds. The calculator validates its input and throws on
 * anything else, so a half-typed `1.5` or a pasted `-5` must be rejected here
 * rather than being allowed to tear down the screen it was typed into.
 */
export function CreditAllocationRow({
  maxCreditsPerExecution,
  maxRuns,
  onCreditsChange,
  onRunsChange,
  operation,
  pricing,
}: CreditAllocationRowProps): ReactNode {
  /** A value already set above its bound stays reachable, as on the runs slider. */
  const creditsCeiling = Math.max(maxCreditsPerExecution, operation.creditsPerExecution);
  const runsCeiling = Math.max(maxRuns, operation.runs);

  return (
    <tr className="border-border border-t align-top">
      <td className="max-w-40 py-3 pr-3" title={operation.label}>
        <span className="block truncate font-medium">{operation.label}</span>
        <span className="text-muted-foreground font-mono text-[0.6875rem] tabular-nums">
          {formatUnitUsd(operation.costPerExecution)} / run
        </span>
      </td>

      <td className="py-3 pr-3">
        <Input
          aria-label={`Credits per execution for ${operation.label}`}
          className="w-full text-right font-mono tabular-nums"
          max={creditsCeiling}
          min={MINIMUM_VALUE}
          step={CREDITS_STEP}
          type="number"
          value={operation.creditsPerExecution}
          onChange={(event) => {
            const credits = Number(event.target.value);

            if (
              event.target.value !== '' &&
              isWithinBounds(credits, MINIMUM_VALUE, creditsCeiling)
            ) {
              onCreditsChange(credits);
            }
          }}
        />
      </td>

      <td className="py-3 pr-3">
        <SliderInput
          aria-label={`Runs for ${operation.label}`}
          max={runsCeiling}
          min={MINIMUM_VALUE}
          step={RUNS_STEP}
          value={[operation.runs]}
          onValueChange={([runs]) => {
            if (runs !== undefined && isWithinBounds(runs, MINIMUM_VALUE, runsCeiling)) {
              onRunsChange(runs);
            }
          }}
          input={{ 'aria-label': `Runs for ${operation.label}` }}
          slider={{ className: 'w-full' }}
        />
      </td>

      <td className="py-3 pr-3 text-right font-mono tabular-nums">
        {operation.credits.toLocaleString()}
      </td>

      <td className="py-3 pr-3 text-right">
        <span className="block font-mono tabular-nums">{formatUsd(operation.cost)}</span>
        <span className="text-muted-foreground block font-mono text-[0.6875rem] tabular-nums">
          {formatUnitUsd(operation.providerCostPerCredit)} / credit
        </span>
      </td>

      {pricing != null && (
        <>
          <td className="py-3 pr-3 text-right">
            <span className="block font-mono tabular-nums">
              {pricing.totalRevenue == null ? ABSENT : formatUsd(pricing.totalRevenue)}
            </span>
            <span className="text-muted-foreground block font-mono text-[0.6875rem] tabular-nums">
              {formatUnitUsd(pricing.revenuePerExecution)} / run
            </span>
          </td>

          <td className="py-3 text-right font-mono tabular-nums">
            {formatPercent(pricing.grossMargin)}
          </td>
        </>
      )}
    </tr>
  );
}

function isWithinBounds(value: number, minimum: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= minimum && value <= maximum;
}
