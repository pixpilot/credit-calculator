import { useState } from 'react';

export interface UseNumericDraftOptions {
  /** True when the field only accepts whole numbers, such as a token count. */
  integer: boolean;
  maximum: number;
  minimum: number;
  onCommit: (value: number) => void;
  value: number;
}

export interface NumericDraft {
  /** Restores the canonical figure once the field is left. */
  onBlur: () => void;
  onChange: (rawValue: string) => void;
  /** What the field shows: the half-typed text, or the calculated figure. */
  text: string;
}

/**
 * Keeps a numeric field editable while its calculator only accepts valid input.
 *
 * The calculation rejects a negative token count, a fractional run or a figure
 * past its own bounds rather than pricing it, so a keystroke that produces one
 * must never reach it. But a field that refuses every intermediate state cannot
 * be edited at all: clearing `100` to type `20` passes through the empty
 * string, and typing `0.5` passes through `0.`.
 *
 * So the raw text is held here while it is being typed, and only a value the
 * calculator accepts is committed. Leaving the field drops the draft, so a
 * half-typed entry is replaced by the figure actually in force rather than
 * left on screen looking as though it counted.
 */
export function useNumericDraft({
  integer,
  maximum,
  minimum,
  onCommit,
  value,
}: UseNumericDraftOptions): NumericDraft {
  const [draft, setDraft] = useState<string | null>(null);

  return {
    onBlur: () => {
      setDraft(null);
    },
    onChange: (rawValue: string) => {
      setDraft(rawValue);

      const parsed = Number(rawValue);

      if (rawValue.trim() === '' || !Number.isFinite(parsed)) return;
      if (parsed < minimum || parsed > maximum) return;
      if (integer && !Number.isSafeInteger(parsed)) return;

      onCommit(parsed);
    },
    text: draft ?? String(value),
  };
}
