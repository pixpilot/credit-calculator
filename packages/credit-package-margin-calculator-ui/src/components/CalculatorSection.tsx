'use client';

import type { ReactNode } from 'react';

import { cn } from '@pixpilot/shadcn';

export interface CalculatorSectionProps {
  /** A control belonging to the section header, such as an add-row button. */
  action?: ReactNode;
  children: ReactNode;
  className?: string | undefined;
  /** True when the body is a wide table that scrolls rather than wraps. */
  scrollable?: boolean | undefined;
  title: string;
}

/**
 * One panel of the calculator: a hairline box under a small capitalised label.
 *
 * A wide table scrolls inside its own panel rather than widening the page, so
 * a narrow viewport still shows the summary and the other tables in place.
 */
export function CalculatorSection({
  action,
  children,
  className,
  scrollable = false,
  title,
}: CalculatorSectionProps): ReactNode {
  return (
    <section className={cn('border-border/60 border', className)}>
      <header className="border-border/60 flex items-center justify-between gap-2 border-b px-3 py-2">
        <h3 className="text-muted-foreground text-[0.6875rem] font-medium tracking-[0.12em] uppercase">
          {title}
        </h3>
        {action}
      </header>
      <div className={cn(scrollable && 'overflow-x-auto')}>{children}</div>
    </section>
  );
}
