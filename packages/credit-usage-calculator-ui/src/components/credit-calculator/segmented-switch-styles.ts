import { cn } from '@pixpilot/shadcn';

/**
 * The inset track a segmented switch inside the calculator sits in. One track
 * holding every choice reads as a single decision; loose buttons read as
 * unrelated actions.
 */
export const SEGMENTED_SWITCH_TRACK_CLASS =
  'border-border/60 bg-muted/70 rounded-full border p-1';

/**
 * One choice in that track. Deliberately quieter than the segmented control a
 * host page puts *above* the calculator — a raised card rather than a filled
 * one — so a switch inside the card reads as subordinate to the one outside it
 * rather than as a second control of equal rank.
 */
export const SEGMENTED_SWITCH_ITEM_CLASS = cn(
  'rounded-full font-medium',
  'text-muted-foreground hover:bg-background/60 hover:text-foreground',
  'data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm',
);
