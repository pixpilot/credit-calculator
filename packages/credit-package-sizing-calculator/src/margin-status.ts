import type { MarginStatus } from './types.ts';

/**
 * How a margin reads against the target, as three named states rather than a
 * colour.
 *
 * A margin that clears the target by a hair is not the same as one with room
 * to spare, and an administrator sweeping a target margin needs to see the
 * difference without comparing two percentages in their head. `unknown` is
 * kept distinct from `below-target`: a margin that cannot be calculated is not
 * a margin that failed.
 */
export function toMarginStatus(
  marginPercent: number | null,
  targetPercent: number,
  healthyPoints: number,
): MarginStatus {
  if (marginPercent == null) return 'unknown';
  if (marginPercent >= targetPercent + healthyPoints) return 'healthy';

  return marginPercent >= targetPercent ? 'acceptable' : 'below-target';
}
