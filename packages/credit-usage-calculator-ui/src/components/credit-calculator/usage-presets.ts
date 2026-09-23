import type { CreditUsage } from '@pixpilot/credit-usage-calculator';
import type { CreditUsagePreset } from './types';

/**
 * A comparable form of a set of quantities.
 *
 * Zero-quantity entries are dropped and the rest sorted, because "not doing
 * this at all" is the same plan whether it is written down as a zero or left
 * out, and the order quantities were selected in is not part of the plan.
 */
function usageKey(usage: readonly CreditUsage[]): string {
  return usage
    .filter((selection) => selection.quantity > 0)
    .map((selection) => `${selection.featureId}:${selection.quantity}`)
    .sort()
    .join('|');
}

/**
 * Which preset the current quantities are, if any.
 *
 * A preset is a starting point rather than a mode, so moving any slider leaves
 * every preset unselected — the switch then reports honestly that the plan on
 * screen is the visitor's own, and clicking one puts a known plan back.
 */
export function matchUsagePresetId(
  presets: readonly CreditUsagePreset[],
  usage: readonly CreditUsage[],
): string | undefined {
  const currentKey = usageKey(usage);

  return presets.find((preset) => usageKey(preset.usage) === currentKey)?.id;
}
