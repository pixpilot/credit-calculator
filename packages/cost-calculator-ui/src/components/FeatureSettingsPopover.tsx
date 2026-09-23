'use client';

import type { CalculatedCostBatch, CostBatch } from '@pixpilot/cost-calculator';
import type { ReactNode } from 'react';

import { Button } from '@pixpilot/shadcn';
import { Popover, PopoverContent, PopoverTrigger } from '@pixpilot/shadcn-ui';
import { Settings2 } from 'lucide-react';
import { CompactBatchEditor } from './CompactBatchEditor.tsx';

export interface FeatureSettingsPopoverProps {
  batch: CostBatch;
  result: CalculatedCostBatch;
  onChange: (batch: CostBatch) => void;
}

/**
 * Opens one feature's settings card beside its summary row, so the dense list
 * stays readable while every path of that feature remains editable in place.
 */
export function FeatureSettingsPopover({
  batch,
  onChange,
  result,
}: FeatureSettingsPopoverProps): ReactNode {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          aria-label={`Settings for ${batch.name}`}
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground size-6"
        >
          <Settings2 aria-hidden="true" className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <CompactBatchEditor
          batch={batch}
          result={result}
          className="border-none bg-transparent py-4 shadow-none"
          onChange={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}
