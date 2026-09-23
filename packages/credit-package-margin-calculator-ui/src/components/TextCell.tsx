'use client';

import type { ReactNode } from 'react';

import { MAX_NAME_LENGTH } from '@pixpilot/credit-package-margin-calculator';
import { cn, Input } from '@pixpilot/shadcn';
import { useState } from 'react';

export interface TextCellProps {
  className?: string | undefined;
  /** Announced to a screen reader, which has no column header to read from. */
  label: string;
  value: string;
  onCommit: (value: string) => void;
}

/**
 * An editable name in a table.
 *
 * The calculation rejects a blank name rather than pricing it, but clearing a
 * field to retype it passes through blank, so the raw text is held here and
 * only a name is committed — the same bargain the numeric cells strike.
 */
export function TextCell({
  className,
  label,
  onCommit,
  value,
}: TextCellProps): ReactNode {
  const [draft, setDraft] = useState<string | null>(null);

  return (
    <Input
      aria-label={label}
      className={cn(
        'border-border/60 h-7 rounded-none border-0 border-b bg-transparent px-1 text-xs',
        'focus-visible:border-foreground shadow-none focus-visible:ring-0',
        className,
      )}
      maxLength={MAX_NAME_LENGTH}
      value={draft ?? value}
      onBlur={() => {
        setDraft(null);
      }}
      onChange={(event) => {
        setDraft(event.target.value);

        if (event.target.value.trim() !== '') onCommit(event.target.value);
      }}
    />
  );
}
