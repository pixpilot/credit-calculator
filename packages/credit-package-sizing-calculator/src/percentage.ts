import type { Money } from '@pixpilot/cost-calculator';

import { toDecimalString, toScaledInteger } from './decimal.ts';
import { subtractMoney, toAtomicUsd } from './money.ts';

/**
 * Percentages held as exact whole micro-percent, so a margin or a buffer never
 * reaches the money arithmetic as a float.
 *
 * One micro-percent is 1e-6 of a percent — finer than any figure an
 * administrator types, and coarse enough that a margin reads back as `93.6%`
 * rather than as `93.60000000000001%`.
 */

const MICRO_PERCENT_PLACES = 6;
const MICRO_PERCENT_PER_PERCENT = 1_000_000n;
const PERCENT_IN_ONE = 100n;
const NOTHING = 0n;
const ROUNDING_DIVISOR = 2n;

/** A whole — 100% — expressed in micro-percent. */
export const ONE_IN_MICRO_PERCENT = PERCENT_IN_ONE * MICRO_PERCENT_PER_PERCENT;

/** Converts a percentage into whole micro-percent. */
export function toMicroPercent(percent: number): bigint {
  return toScaledInteger(toDecimalString(percent), MICRO_PERCENT_PLACES);
}

/** Restates whole micro-percent as the percentage a caller reads. */
export function toPercent(microPercent: bigint): number {
  return Number(microPercent) / Number(MICRO_PERCENT_PER_PERCENT);
}

/** `1 + percent`, in micro-percent — what a safety buffer multiplies by. */
export function addedShare(percent: number): bigint {
  return ONE_IN_MICRO_PERCENT + toMicroPercent(percent);
}

/** `1 - percent`, in micro-percent — the share of revenue a margin leaves. */
export function remainingShare(percent: number): bigint {
  return ONE_IN_MICRO_PERCENT - toMicroPercent(percent);
}

/**
 * The gross margin an amount of revenue earns after a cost: what is left of
 * the revenue, as a share of the revenue.
 *
 * Margin is measured against revenue, not against cost — a 400% markup and an
 * 80% margin are the same price, and confusing the two is what makes a credit
 * look four times more profitable than it is. `null` when there is no revenue
 * to measure against, so a free package reports "not applicable" rather than a
 * margin of `-Infinity`.
 */
export function grossMarginPercent(revenue: Money, cost: Money): number | null {
  const revenueAtomic = toAtomicUsd(revenue);

  if (revenueAtomic === NOTHING) return null;

  return toPercent(
    ratioToMicroPercent(toAtomicUsd(subtractMoney(revenue, cost)), revenueAtomic),
  );
}

/**
 * Expresses one exact quantity as a percentage of another, rounding half away
 * from zero at micro-percent.
 *
 * The ratio is taken in `bigint` because both sides are atomic money units:
 * turning them into floats first is what would make a margin read as
 * `79.99999999999999`.
 */
function ratioToMicroPercent(numerator: bigint, denominator: bigint): bigint {
  const scaled = numerator * ONE_IN_MICRO_PERCENT * ROUNDING_DIVISOR;
  const bias = numerator < NOTHING ? -denominator : denominator;

  return (scaled + bias) / (denominator * ROUNDING_DIVISOR);
}
