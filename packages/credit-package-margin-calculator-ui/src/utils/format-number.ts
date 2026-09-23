const TOTAL_MINIMUM_DIGITS = 2;
const TOTAL_MAXIMUM_DIGITS = 6;
const UNIT_MINIMUM_DIGITS = 6;
const UNIT_MAXIMUM_DIGITS = 9;
const PERCENT_DIGITS = 2;

/** What every formatter shows where there is no figure to show. */
export const ABSENT = '—';

/**
 * Formats a total — a month's spend, a package price — to the cents an
 * administrator reads, with room for the sub-cent digits this calculator's
 * cheapest rows live in.
 *
 * Rounding a sub-cent total to `$0.00` reads as a workload that costs nothing,
 * which is exactly the mistake this screen exists to prevent.
 */
export function formatUsd(value: number | null): string {
  return format(value, TOTAL_MINIMUM_DIGITS, TOTAL_MAXIMUM_DIGITS, '$');
}

/**
 * Formats a per-unit rate — cost per run, cost per credit — which is where the
 * interesting digits are, so it starts at more decimal places than a total.
 */
export function formatUnitUsd(value: number | null): string {
  return format(value, UNIT_MINIMUM_DIGITS, UNIT_MAXIMUM_DIGITS, '$');
}

/** Formats a margin to the two places a percentage point is read at. */
export function formatPercent(value: number | null): string {
  const formatted = format(value, PERCENT_DIGITS, PERCENT_DIGITS, '');

  return formatted === ABSENT ? ABSENT : `${formatted}%`;
}

/** Formats a whole count — credits, tokens, runs — with thousands separators. */
export function formatCount(value: number | null): string {
  return format(value, 0, 0, '');
}

/**
 * A figure that is not a number is shown as nothing rather than as `NaN`.
 *
 * The calculator reports an undefined rate as `null`, so this is the only
 * place that has to decide what an absent figure looks like.
 */
function format(
  value: number | null,
  minimumFractionDigits: number,
  maximumFractionDigits: number,
  prefix: string,
): string {
  if (value == null || !Number.isFinite(value)) return ABSENT;

  const formatted = new Intl.NumberFormat('en', {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(Math.abs(value));

  /** A loss reads as `-$0.12`, never as `$-0.12`. */
  return `${value < 0 ? '-' : ''}${prefix}${formatted}`;
}
