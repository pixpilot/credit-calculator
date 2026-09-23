import type { CreditFeature } from '@pixpilot/credit-usage-calculator';
import type { CreditCalculatorView, CreditUsagePreset } from '../src';
import { useState } from 'react';

import { CreditCalculator, PLANNING_VIEW, SPENDING_VIEW } from '../src';

const features: readonly CreditFeature[] = [
  {
    id: 'analysis',
    label: 'AI Analysis',
    description: 'Analyze a document with AI.',
    creditCost: 5,
  },
  {
    id: 'document',
    label: 'Document generation',
    description: 'Generate a tailored document.',
    creditCost: 25,
  },
  {
    id: 'message',
    label: 'AI message',
    description: 'Send an AI message.',
    creditCost: 1,
  },
];

/** Worked examples of a period of use, as a host app would supply them. */
const usagePresets: readonly CreditUsagePreset[] = [
  {
    id: 'casual',
    label: 'Casual',
    usage: [
      { featureId: 'analysis', quantity: 20 },
      { featureId: 'document', quantity: 2 },
      { featureId: 'message', quantity: 30 },
    ],
  },
  {
    id: 'active',
    label: 'Active',
    isDefault: true,
    usage: [
      { featureId: 'analysis', quantity: 40 },
      { featureId: 'document', quantity: 6 },
      { featureId: 'message', quantity: 80 },
    ],
  },
  {
    id: 'power',
    label: 'Power',
    usage: [
      { featureId: 'analysis', quantity: 90 },
      { featureId: 'document', quantity: 14 },
      { featureId: 'message', quantity: 180 },
    ],
  },
];

function InteractiveCalculator({
  initialSelectedFeatureId,
  views,
}: {
  initialSelectedFeatureId?: string;
  /** Which calculators the story offers; omitted, it offers both. */
  views?: readonly CreditCalculatorView[];
}) {
  const [usage, setUsage] = useState<{ featureId: string; quantity: number }[]>([
    { featureId: 'analysis', quantity: 30 },
    { featureId: 'document', quantity: 4 },
    { featureId: 'message', quantity: 50 },
  ]);

  return (
    <div className="max-w-2xl">
      <CreditCalculator
        credits={500}
        features={features}
        usage={usage}
        usagePresets={usagePresets}
        views={views}
        initialSelectedFeatureId={initialSelectedFeatureId}
        onUsageChange={(nextUsage) => setUsage([...nextUsage])}
      />
    </div>
  );
}

export default {
  title: 'Credit calculator/CreditCalculator',
  component: CreditCalculator,
  parameters: { layout: 'padded' },
};

/** The plan usage calculator alone: with no second view, no switch is shown. */
export const PlanUsage = {
  render: () => <InteractiveCalculator views={[PLANNING_VIEW]} />,
};

/** The spend credits calculator alone, opening on a chosen feature. */
export const SpendCredits = {
  render: () => (
    <InteractiveCalculator views={[SPENDING_VIEW]} initialSelectedFeatureId="analysis" />
  ),
};

/** Every feature planned together, starting from a worked example. */
export const AllFeatures = {
  render: () => <InteractiveCalculator />,
};

/** A focused view shows the selected feature and its remaining-credit alternatives. */
export const SingleFeature = {
  render: () => <InteractiveCalculator initialSelectedFeatureId="analysis" />,
};
