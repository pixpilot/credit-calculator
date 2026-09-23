import type { Money } from '@pixpilot/cost-calculator';

const MINIMUM_DECIMAL_PLACES = 2;

/** Formats an exact decimal USD value without converting it back to a float. */
export function formatUsd(money: Money): string {
  const [whole, fraction] = money.amount.split('.');
  const groupedWhole = whole!.replace(/\B(?=(?:\d{3})+(?!\d))/gu, ',');
  const displayFraction = fraction?.padEnd(MINIMUM_DECIMAL_PLACES, '0') ?? '00';

  return `$${groupedWhole}.${displayFraction}`;
}
