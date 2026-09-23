import type { CreditEquivalent } from '@pixpilot/credit-usage-calculator';
import type { ReactNode } from 'react';

interface RemainingEquivalentsProps {
  remainingCredits: number;
  equivalents: readonly CreditEquivalent[];
}

/** Lists what the remaining credit balance can fund for other configured features. */
export function RemainingEquivalents({
  remainingCredits,
  equivalents,
}: RemainingEquivalentsProps): ReactNode {
  if (remainingCredits === 0) {
    return <p className="text-muted-foreground text-sm">No credits remaining.</p>;
  }

  return (
    <section
      className="border-border space-y-2 border-t pt-4"
      aria-label="Remaining credit equivalents"
    >
      <p className="text-sm font-medium">
        With your remaining {remainingCredits} credits:
      </p>
      <ul className="text-muted-foreground space-y-1 text-sm">
        {equivalents.map((equivalent) => (
          <li key={equivalent.featureId}>
            {equivalent.quantity} {equivalent.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
