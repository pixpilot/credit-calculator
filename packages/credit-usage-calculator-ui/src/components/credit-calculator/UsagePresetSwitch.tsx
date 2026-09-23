import type { ReactNode } from 'react';
import type { CreditUsagePreset } from './types';
import { cn, ToggleGroup, ToggleGroupItem } from '@pixpilot/shadcn';
import { useId } from 'react';
import {
  SEGMENTED_SWITCH_ITEM_CLASS,
  SEGMENTED_SWITCH_TRACK_CLASS,
} from './segmented-switch-styles';

/** A starting point rather than the question itself, so it sits a size below. */
const USAGE_PRESET_ITEM_CLASS = cn(SEGMENTED_SWITCH_ITEM_CLASS, 'h-7 px-3 text-xs');

interface UsagePresetSwitchProps {
  presets: readonly CreditUsagePreset[];
  /** The preset the sliders currently spell out, or `undefined` once edited. */
  selectedPresetId: string | undefined;
  onPresetSelected: (preset: CreditUsagePreset) => void;
}

/**
 * Worked examples of what a month of use looks like, as a starting point for
 * the planning view.
 *
 * A visitor sizing a purchase has no idea how many cover letters a year of job
 * hunting takes, so an empty set of sliders asks them a question they came here
 * to have answered. These fill the sliders in with a plausible answer they can
 * then drag into their own shape — which is why nothing is selected once they
 * do, and why picking one again simply restores it.
 */
export function UsagePresetSwitch({
  presets,
  selectedPresetId,
  onPresetSelected,
}: UsagePresetSwitchProps): ReactNode {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span id={labelId} className="text-sm font-medium">
        Example usage
      </span>
      <ToggleGroup
        type="single"
        spacing={1}
        aria-labelledby={labelId}
        // An edited plan is nobody's preset, and a toggle group says so with an
        // empty value rather than by leaving the last pick falsely lit.
        value={selectedPresetId ?? ''}
        className={SEGMENTED_SWITCH_TRACK_CLASS}
        onValueChange={(nextPresetId) => {
          const preset = presets.find((candidate) => candidate.id === nextPresetId);

          // Re-picking the selected preset empties the group; the plan on screen
          // is already that preset, so there is nothing to put back.
          if (preset !== undefined) {
            onPresetSelected(preset);
          }
        }}
      >
        {presets.map((preset) => (
          <ToggleGroupItem
            key={preset.id}
            value={preset.id}
            className={USAGE_PRESET_ITEM_CLASS}
          >
            {preset.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
