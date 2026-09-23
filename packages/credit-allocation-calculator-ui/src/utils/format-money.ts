import type { Money } from '@pixpilot/cost-calculator';
import type { Ratio } from '@pixpilot/credit-allocation-calculator';

const TOTAL_MINIMUM_DIGITS = 2;
const TOTAL_MAXIMUM_DIGITS = 8;
const UNIT_DIGITS = 5;
const FALLBACK_DIGITS = 12;
const PERCENT_DIGITS = 1;
const PERCENT_FALLBACK_DIGITS = 4;
const PERCENT_SHIFT = 2;
const ROUND_UP_DIGIT = '5';
const CARRY = 1n;
const NO_CARRY = 0n;
const ABSENT = '—';

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
 *
 * A negative amount — an operation sold below what it costs to serve — keeps
 * its sign, because a loss shown as a profit is the worst thing this screen
 * could say.
 */
export function formatUsd(
  money: Money,
  minimumFractionDigits = TOTAL_MINIMUM_DIGITS,
  maximumFractionDigits = TOTAL_MAXIMUM_DIGITS,
): string {
  const magnitude = withoutSign(money.amount);
  const formatted = toFixedUsd(magnitude, minimumFractionDigits, maximumFractionDigits);
  const resolved =
    isRoundedAway(formatted) && !isZero(magnitude)
      ? toFixedUsd(magnitude, minimumFractionDigits, FALLBACK_DIGITS)
      : formatted;

  return isNegative(money.amount) && !isRoundedAway(resolved) ? `-${resolved}` : resolved;
}

/**
 * Formats a per-unit rate — provider cost per run, revenue per credit — which
 * is where the interesting digits of this calculator live, so it starts at
 * more decimal places than a total does.
 */
export function formatUnitUsd(money: Money | null): string {
  if (money == null) return ABSENT;

  return formatUsd(money, UNIT_DIGITS, UNIT_DIGITS);
}

/**
 * Formats an exact ratio as a percentage, shifting the decimal point rather
 * than multiplying a float by 100.
 *
 * A margin with no revenue to measure it against is shown as absent, the same
 * way a rate with no denominator is: `0.0%` would read as a break-even sale
 * that never happened.
 */
export function formatPercent(ratio: Ratio | null): string {
  if (ratio == null) return ABSENT;

  const magnitude = toPercentMagnitude(ratio.value);
  const formatted = roundDecimal(magnitude, PERCENT_DIGITS);
  const resolved =
    isZeroPercent(formatted) && !isZero(magnitude)
      ? roundDecimal(magnitude, PERCENT_FALLBACK_DIGITS)
      : formatted;

  return isNegative(ratio.value) && !isZeroPercent(resolved)
    ? `-${resolved}%`
    : `${resolved}%`;
}

function toFixedUsd(
  amount: string,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
): string {
  const [whole = '0', fraction = ''] = roundDecimal(amount, maximumFractionDigits).split(
    '.',
  );
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

function isZeroPercent(formatted: string): boolean {
  return /^0(?:\.0*)?$/u.test(formatted);
}

function isZero(amount: string): boolean {
  return /^0(?:\.0*)?$/u.test(amount);
}

function isNegative(decimal: string): boolean {
  return decimal.startsWith('-');
}

function withoutSign(decimal: string): string {
  return isNegative(decimal) ? decimal.slice(1) : decimal;
}

/** Moves a ratio's decimal point two places, so `0.7148` becomes `71.48`. */
function toPercentMagnitude(value: string): string {
  const [whole = '0', fraction = ''] = withoutSign(value).split('.');
  const shifted = fraction.padEnd(PERCENT_SHIFT, '0');
  const shiftedWhole = `${whole}${shifted.slice(0, PERCENT_SHIFT)}`.replace(
    /^0+(?=\d)/u,
    '',
  );
  const shiftedFraction = shifted.slice(PERCENT_SHIFT);

  return shiftedFraction.length > 0 ? `${shiftedWhole}.${shiftedFraction}` : shiftedWhole;
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
