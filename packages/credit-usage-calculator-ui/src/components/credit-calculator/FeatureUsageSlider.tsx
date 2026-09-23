import type { CalculatedCreditFeature } from '@pixpilot/credit-usage-calculator';
import type { ReactNode } from 'react';
import { SliderInput } from '@pixpilot/shadcn-ui';

interface FeatureUsageSliderProps {
  feature: CalculatedCreditFeature;
  /** How far this feature's track runs — a budget's reach, or a planning cap. */
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
}

/** Displays one accessible integer quantity slider backed by the core calculation result. */
export function FeatureUsageSlider({
  feature,
  maxQuantity,
  onQuantityChange,
}: FeatureUsageSliderProps): ReactNode {
  /*
   * A slider needs a range to be a slider. A balance too small to afford even
   * one of this action gives a maximum of zero, which is a track with no length
   * — so it is floored at one, and the summary still says when the selection
   * has gone over budget. The current quantity is included because a controlled
   * consumer may hold one above what the range now covers.
   */
  const maximum = Math.max(maxQuantity, feature.quantity, 1);

  return (
    <section className="space-y-2" aria-labelledby={`credit-feature-${feature.id}`}>
      <div className="-mb-0.5 space-y-0.5">
        <h3 id={`credit-feature-${feature.id}`} className="text-sm font-medium">
          {feature.label}
        </h3>
        {feature.description !== undefined && (
          <p className="text-muted-foreground text-xs">{feature.description}</p>
        )}
      </div>

      {/* The shared shadcn slider, so this control looks and behaves like every
          other slider in the workspace. Its own labelled section names it: the
          primitive builds its thumb internally and takes no label of its own. */}
      <SliderInput
        min={0}
        max={maximum}
        step={1}
        input={{
          max: undefined,
        }}
        value={[feature.quantity]}
        onValueChange={([quantity]) => {
          if (quantity != null) {
            onQuantityChange(quantity);
          }
        }}
      />

      {/* The reading of the slider, and the scale it is read against, on one
          line — two stacked rows pushed the next feature off the screen. */}
      <div className="-mt-1.5 flex flex-wrap items-baseline justify-between gap-x-4 text-xs">
        <span className="">
          {feature.quantity} {feature.label}
          <span className="text-muted-foreground" aria-hidden="true">
            {/* {' '}
            of {maximum} */}
          </span>
        </span>
        <span className="font-medium">{feature.usedCredits} credits used</span>
      </div>
    </section>
  );
}
