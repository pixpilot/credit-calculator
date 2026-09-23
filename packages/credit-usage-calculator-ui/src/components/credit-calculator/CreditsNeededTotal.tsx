import type { ReactNode } from 'react';

interface CreditsNeededTotalProps {
  credits: number;
}

/**
 * What the selected usage adds up to, in the view that has no balance.
 *
 * The answer the planning view exists to give, so it sits where the balance
 * field sits in the other view — at the top, in front of the visitor as they
 * move the sliders, rather than at the foot of a list they would have to
 * scroll back from.
 */
export function CreditsNeededTotal({ credits }: CreditsNeededTotalProps): ReactNode {
  return (
    <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0.5">
      <span className="text-muted-foreground text-sm font-medium">Credits needed</span>
      <output className="text-2xl leading-none font-semibold tabular-nums">
        {credits.toLocaleString()}
      </output>
    </div>
  );
}
