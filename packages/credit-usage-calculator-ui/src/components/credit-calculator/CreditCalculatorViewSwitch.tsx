import type { ReactNode } from 'react';
import type { CreditCalculatorView } from './credit-calculator-view';
import { cn, ToggleGroup, ToggleGroupItem } from '@pixpilot/shadcn';
import { PLANNING_VIEW, SPENDING_VIEW } from './credit-calculator-view';
import {
  SEGMENTED_SWITCH_ITEM_CLASS,
  SEGMENTED_SWITCH_TRACK_CLASS,
} from './segmented-switch-styles';

/** Planning first: it is the view a visitor sizing a purchase arrives on. */
const VIEW_OPTIONS: readonly { view: CreditCalculatorView; label: string }[] = [
  { view: PLANNING_VIEW, label: 'Plan usage' },
  { view: SPENDING_VIEW, label: 'Spend credits' },
];

/** Two views make a choice; one makes a label the visitor cannot act on. */
const MIN_SWITCHABLE_VIEWS = 2;

/** Both questions, for a caller that has not narrowed them. */
const ALL_VIEWS: readonly CreditCalculatorView[] = VIEW_OPTIONS.map(
  (option) => option.view,
);

/** The card's primary switch, so it stands at the full height of the track. */
const VIEW_SWITCH_ITEM_CLASS = cn(SEGMENTED_SWITCH_ITEM_CLASS, 'h-8 px-4');

interface CreditCalculatorViewSwitchProps {
  view: CreditCalculatorView;
  /** The views on offer. Fewer than two of them renders nothing. */
  views?: readonly CreditCalculatorView[];
  onViewChange: (view: CreditCalculatorView) => void;
}

/**
 * Picks which question the calculator is answering.
 *
 * The two views are different calculators sharing a set of prices, not two
 * entries in one list of features — so choosing between them belongs in a
 * control of its own rather than as an extra option inside the feature select,
 * where "All features" sat as a peer of things it is not comparable to.
 *
 * A radio group rather than tabs: the panel below is one calculator being
 * re-asked, not two panels being swapped, so there is no tab panel to own.
 */
export function CreditCalculatorViewSwitch({
  view,
  views = ALL_VIEWS,
  onViewChange,
}: CreditCalculatorViewSwitchProps): ReactNode {
  const options = VIEW_OPTIONS.filter((option) => views.includes(option.view));

  // A switch between one choice is not a control but a claim that there is
  // something to pick, so a single offered view is left unannounced.
  if (options.length < MIN_SWITCHABLE_VIEWS) {
    return null;
  }

  return (
    <ToggleGroup
      type="single"
      spacing={1}
      aria-label="Calculator view"
      value={view}
      className={SEGMENTED_SWITCH_TRACK_CLASS}
      onValueChange={(next) => {
        // Re-picking the selected choice clears a toggle group. A view is never
        // absent, so an emptied selection is simply the current one kept.
        if (next !== '') {
          onViewChange(next as CreditCalculatorView);
        }
      }}
    >
      {options.map(({ view: optionView, label }) => (
        <ToggleGroupItem
          key={optionView}
          value={optionView}
          className={VIEW_SWITCH_ITEM_CLASS}
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
