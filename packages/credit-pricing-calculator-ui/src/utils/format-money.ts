import type { Money } from '@pixpilot/cost-calculator';

const TOTAL_MINIMUM_DIGITS = 2;
const TOTAL_MAXIMUM_DIGITS = 8;
const UNIT_DIGITS = 5;
const PERCENT_MAXIMUM_DIGITS = 4;
const FALLBACK_DIGITS = 12;
const ROUND_UP_DIGIT = '5';
const CARRY = 1n;
const NO_CARRY = 0n;

/**
 * Formats an exact decimal amount without converting it back to a float.
 *
 * The calculator's amounts routinely run to many decimal places, so a display
 * value is rounded here rather than at the source: the totals stay exact for
 * further arithmetic while the screen shows a number an administrator can read.
 *
 * Totals keep enough decimal places to show the cheapest feature this
 * calculator is built for. Rounding a total to cents hides a whole row of a
 * sub-cent workload, which reads as a grand total that ignores the feature the
 * administrator is editing. Trailing zeros are dropped, so a round figure is
 * still shown as `$12.50` rather than padded out.
 *
 * An amount too small even for that is shown with more digits instead of as
 * `$0.00`: a workload that costs almost nothing is still not free, and reading
 * it as free is exactly the mistake this screen exists to prevent.
 */
export function formatUsd(
  money: Money,
  minimumFractionDigits = TOTAL_MINIMUM_DIGITS,
  maximumFractionDigits = TOTAL_MAXIMUM_DIGITS,
): string {
  const formatted = toFixedUsd(money, minimumFractionDigits, maximumFractionDigits);

  return isRoundedAway(formatted) && !isZero(money)
    ? toFixedUsd(money, minimumFractionDigits, FALLBACK_DIGITS)
    : formatted;
}

/**
 * Formats a per-unit rate — cost per run, cost per credit — which is where the
 * interesting digits of this calculator live, so it starts at more decimal
 * places than a total does.
 */
export function formatUnitUsd(money: Money | null): string {
  if (money == null) return '—';

  return formatUsd(money, UNIT_DIGITS, UNIT_DIGITS);
}

function toFixedUsd(
  money: Money,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): string {
  const [whole = '0', fraction = ''] = roundDecimal(
    money.amount,
    maximumFractionDigits,
  ).split('.');
  const displayFraction = fraction.replace(/0+$/u, '').padEnd(minimumFractionDigits, '0');
  const groupedWhole = whole.replace(/\B(?=(?:\d{3})+(?!\d))/gu, ',');

  return displayFraction.length > 0
    ? `$${groupedWhole}.${displayFraction}`
    : `$${groupedWhole}`;
}

/** True when a formatted amount reads as nothing at all: `$0`, `$0.00`, … */
function isRoundedAway(formatted: string): boolean {
  return /^\$0(?:\.0*)?$/u.test(formatted);
}

function isZero(money: Money): boolean {
  return /^0(?:\.0*)?$/u.test(money.amount);
}

/** Rounds a decimal string half up, without ever building a float from it. */
function roundDecimal(amount: string, digits: number): string {
  const [whole = '0', fraction = ''] = amount.split('.');
  const keptFraction = fraction.slice(0, digits).padEnd(digits, '0');
  const shouldRoundUp = fraction.charAt(digits) >= ROUND_UP_DIGIT;
  const scaled = (BigInt(`${whole}${keptFraction}`) + (shouldRoundUp ? CARRY : NO_CARRY))
    .toString()
    .padStart(digits + 1, '0');

  return digits === 0
    ? scaled
    : `${scaled.slice(0, scaled.length - digits)}.${scaled.slice(scaled.length - digits)}`;
}

/**
 * Formats a percentage a calculation produced, dropping the digits it did not
 * need.
 *
 * A margin is shown as the figure an administrator typed — `80%`, not
 * `80.000000%` — while a margin that landed between two of them keeps enough
 * places to show that it did.
 */
export function formatPercent(percent: number | null): string {
  if (percent == null) return '—';

  return `${new Intl.NumberFormat('en', {
    maximumFractionDigits: PERCENT_MAXIMUM_DIGITS,
  }).format(percent)}%`;
}
