'use client';

import type { ReactNode } from 'react';

import { Input } from '@pixpilot/shadcn-ui';
import { useId, useState } from 'react';

const NO_DRAFT = null;

export interface NumberFieldProps {
  className?: string | undefined;
  /** `false` keeps the label for screen readers only, for a table cell. */
  showLabel?: boolean | undefined;
  /**
   * Whether a typed value may be reported. Backed by the calculator's own
   * schemas, so the only figures that reach a calculation are ones it accepts.
   */
  isValid: (value: number) => boolean;
  label: string;
  max?: number | undefined;
  min?: number | undefined;
  onChange: (value: number) => void;
  step?: number | undefined;
  /** A unit shown beside the control, such as `%`. */
  suffix?: string | undefined;
  value: number;
}

/**
 * A numeric input that keeps what is typed and reports only what is valid.
 *
 * The draft is held locally so a half-typed figure — an empty box on the way
 * to a new number, a lone `0.` before its decimals — stays on screen instead of
 * snapping back, while the calculation behind it keeps the last value it could
 * actually use. Nothing invalid is ever reported, because the calculator
 * validates its input and throws on anything else: a cleared box must not tear
 * down the screen it was cleared in.
 *
 * The draft is dropped on blur, so a field left holding something unusable
 * shows the figure the calculation is really running on.
 */
export function NumberField({
  className,
  isValid,
  label,
  max,
  min,
  onChange,
  showLabel = true,
  step,
  suffix,
  value,
}: NumberFieldProps): ReactNode {
  const inputId = useId();
  const [draft, setDraft] = useState<string | null>(NO_DRAFT);

  return (
    <div className={className ?? 'space-y-1'}>
      <label
        className={
          showLabel ? 'text-muted-foreground block text-xs font-medium' : 'sr-only'
        }
        htmlFor={inputId}
      >
        {label}
      </label>
      <span className="flex items-baseline gap-1">
        <Input
          className="h-8 w-full text-right font-mono tabular-nums"
          id={inputId}
          inputMode="decimal"
          max={max}
          min={min}
          step={step}
          type="number"
          value={draft ?? value}
          onBlur={() => setDraft(NO_DRAFT)}
          onChange={(event) => {
            const typed = event.target.value;
            setDraft(typed);

            const parsed = Number(typed);

            if (typed !== '' && Number.isFinite(parsed) && isValid(parsed)) {
              onChange(parsed);
            }
          }}
        />
        {suffix != null && (
          <span className="text-muted-foreground text-xs">{suffix}</span>
        )}
      </span>
    </div>
  );
}
