const NOTHING = 0;

/**
 * Rounds a credit count down to a whole number of package increments.
 *
 * Down, never to nearest: this is what turns a calculated ceiling into a
 * package that may actually be sold, and rounding up sells credits the target
 * margin does not cover.
 */
export function floorToIncrement(value: number, increment: number): number {
  if (increment <= NOTHING) return Math.max(Math.floor(value), NOTHING);

  return Math.max(Math.floor(value / increment) * increment, NOTHING);
}

/**
 * Rounds a credit count to the nearest whole number of package increments.
 *
 * Used for the figures a bonus produces rather than the ones a limit does: a
 * subscription's credits are a marketing number, and `700` reads as an offer
 * where `700.0000001` reads as a bug.
 */
export function roundToIncrement(value: number, increment: number): number {
  if (increment <= NOTHING) return Math.max(Math.round(value), NOTHING);

  return Math.max(Math.round(value / increment) * increment, NOTHING);
}
