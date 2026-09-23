import type { CreditFeature } from '@pixpilot/credit-usage-calculator';
import type { ReactNode } from 'react';
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@pixpilot/shadcn';

interface FeatureSelectorProps {
  features: readonly CreditFeature[];
  selectedFeatureId: string;
  onSelectedFeatureChange: (featureId: string) => void;
}

/**
 * Picks which single feature the spending view is focused on.
 *
 * Only configured features are listed. Choosing "everything at once" is a
 * different question rather than a wider selection of the same one, so it lives
 * on the view switch beside this control — which is also why this select is
 * absent altogether in the view that has no one feature to focus on.
 */
export function FeatureSelector({
  features,
  selectedFeatureId,
  onSelectedFeatureChange,
}: FeatureSelectorProps): ReactNode {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Label htmlFor="credit-calculator-feature-selector" className="text-sm font-medium">
        Feature
      </Label>
      <Select value={selectedFeatureId} onValueChange={onSelectedFeatureChange}>
        <SelectTrigger id="credit-calculator-feature-selector" className="w-full sm:w-40">
          <SelectValue placeholder="Select a feature" />
        </SelectTrigger>
        <SelectContent>
          {features.map((feature) => (
            <SelectItem key={feature.id} value={feature.id}>
              {feature.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
