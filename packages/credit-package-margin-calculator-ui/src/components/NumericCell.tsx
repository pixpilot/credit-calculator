'use client';

import type { ReactNode } from 'react';

import { cn, Input } from '@pixpilot/shadcn';
import { useNumericDraft } from '../hooks/use-numeric-draft.ts';

const DEFAULT_MINIMUM = 0;
const WHOLE_STEP = 1;

export interface NumericCellProps {
  className?: string | undefined;
  /** True for a count — credits, tokens, runs — that only accepts whole numbers. */
  integer?: boolean | undefined;
  /** Announced to a screen reader, which has no column header to read from. */
  label: string;
  /** The largest figure the calculation will price. Past it, nothing is committed. */
  maximum: number;
  minimum?: number | undefined;
  step?: number | undefined;
  value: number;
  onCommit: (value: number) => void;
}

/**
 * One editable figure in a table, styled as an instrument readout rather than
 * as a form field: no fill, no radius, a single hairline that lights up under
 * the caret.
 */
export function NumericCell({
  className,
  integer = false,
  label,
  maximum,
  minimum = DEFAULT_MINIMUM,
  onCommit,
  step = WHOLE_STEP,
  value,
}: NumericCellProps): ReactNode {
  const draft = useNumericDraft({ integer, maximum, minimum, onCommit, value });

  return (
    <Input
      aria-label={label}
      className={cn(
        'border-border/60 h-7 w-full rounded-none border-0 border-b bg-transparent px-1',
        'text-right font-mono text-xs tabular-nums shadow-none',
        'focus-visible:border-foreground focus-visible:ring-0',
        className,
      )}
      max={maximum}
      min={minimum}
      step={step}
      type="number"
      value={draft.text}
      onBlur={draft.onBlur}
      onChange={(event) => {
        draft.onChange(event.target.value);
      }}
    />
  );
}
