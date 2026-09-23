'use client';

import type { CostBatch, ModelPricing } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { calculateCost } from '@pixpilot/cost-calculator';
import { Button, cn } from '@pixpilot/shadcn';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { useCostCalculatorState } from '../hooks/use-cost-calculator-state.ts';
import { CompactCostBatchesSection } from './CompactCostBatchesSection.tsx';
import { CostBatchesSection } from './CostBatchesSection.tsx';
import { CostSummary } from './CostSummary.tsx';

export interface CostCalculatorProps {
  className?: string | undefined;
  /** Dense scenario editor used when the host provides a fixed feature list. */
  compact?: boolean | undefined;
  defaultValue?: CostBatch[] | undefined;
  /** The one model whose token rates price every batch. */
  model: ModelPricing;
  onChange?: ((value: CostBatch[]) => void) | undefined;
  /**
   * Heading above the calculator. `null` when the host page already names it,
   * so the screen does not say it twice.
   */
  title?: string | null | undefined;
  value?: CostBatch[] | undefined;
}

/** Interactive, reusable editor for provider and infrastructure cost scenarios. */
export function CostCalculator({
  className,
  compact = false,
  defaultValue,
  model,
  onChange,
  title = 'Cost calculator',
  value: controlledValue,
}: CostCalculatorProps): ReactNode {
  const headingId = useId();
  const featureEstimatesId = useId();
  const [showFeatureEstimates, setShowFeatureEstimates] = useState(false);
  const { update, value } = useCostCalculatorState({
    defaultValue,
    onChange,
    value: controlledValue,
  });
  const result = useMemo(() => calculateCost(value, model), [model, value]);

  const updateBatch = (batchIndex: number, batch: CostBatch) => {
    update((currentValue) =>
      currentValue.map((currentBatch, index) =>
        index === batchIndex ? batch : currentBatch,
      ),
    );
  };

  const updateBatchQuantity = (batchIndex: number, quantity: number) => {
    update((currentValue) =>
      currentValue.map((batch, index) =>
        index === batchIndex ? { ...batch, quantity } : batch,
      ),
    );
  };

  return (
    <div className={className ?? (compact ? 'space-y-4' : 'space-y-8')}>
      {title != null && (
        <h2 id={headingId} className="text-xl font-semibold">
          {title}
        </h2>
      )}
      {compact && (
        <div className="flex justify-end">
          <Button
            type="button"
            aria-controls={featureEstimatesId}
            aria-expanded={showFeatureEstimates}
            size="sm"
            variant="outline"
            onClick={() => setShowFeatureEstimates((shown) => !shown)}
          >
            <SlidersHorizontal aria-hidden="true" />
            {showFeatureEstimates ? 'Hide feature estimates' : 'Show feature estimates'}
            <ChevronDown
              aria-hidden="true"
              className={cn('transition-transform', showFeatureEstimates && 'rotate-180')}
            />
          </Button>
        </div>
      )}
      <CostSummary
        compact={compact}
        result={result}
        value={compact ? value : undefined}
        onBatchChange={compact ? updateBatch : undefined}
        onQuantityChange={compact ? updateBatchQuantity : undefined}
      />

      {compact && showFeatureEstimates && (
        <CompactCostBatchesSection
          id={featureEstimatesId}
          result={result}
          update={update}
          value={value}
        />
      )}
      {!compact && <CostBatchesSection result={result} update={update} value={value} />}
    </div>
  );
}
