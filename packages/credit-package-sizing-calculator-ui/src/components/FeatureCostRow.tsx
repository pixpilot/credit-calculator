'use client';

import type {
  CalculatedCreditPricingFeature,
  CreditPricingFeature,
} from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import {
  creditsPerExecutionSchema,
  fixedCostPerExecutionSchema,
  quantitySchema,
  tokenCountSchema,
} from '@pixpilot/credit-package-sizing-calculator';
import { Button, Input } from '@pixpilot/shadcn-ui';
import { Trash2 } from 'lucide-react';

import { useCreditPricingFormatters } from '../utils/format-context.tsx';
import { NumberField } from './NumberField.tsx';

const WHOLE_STEP = 1;
const TOKEN_STEP = 500;
const COST_STEP = 0.0001;
const MINIMUM = 0;
const MINIMUM_CREDITS = 1;
const ICON_SIZE = 14;

export interface FeatureCostRowProps {
  calculated: CalculatedCreditPricingFeature;
  /** The row as it is stored, so an edit starts from the figure that was typed. */
  feature: CreditPricingFeature;
  onChange: (changes: Partial<CreditPricingFeature>) => void;
  onRemove: () => void;
}

/**
 * One feature: the five figures an administrator owns, and the five the
 * calculator derives from them.
 *
 * Editable and calculated cells sit in the same row rather than in two tables,
 * so an edit and its consequence are read together — the whole point of the
 * screen is watching a cost per credit move as the tokens beside it change.
 *
 * Only values the calculator accepts are ever reported. It validates its input
 * and throws on anything else, so a cleared box or a pasted `-5` has to be
 * refused here rather than being allowed to tear down the table it was typed
 * into.
 */
export function FeatureCostRow({
  calculated,
  feature,
  onChange,
  onRemove,
}: FeatureCostRowProps): ReactNode {
  const format = useCreditPricingFormatters();

  return (
    <tr className="border-border border-t align-middle">
      <td className="py-2 pr-2">
        <Input
          aria-label={`Name of feature ${calculated.name}`}
          className="h-8 w-full"
          type="text"
          value={calculated.name}
          onChange={(event) => {
            if (event.target.value.trim() !== '') onChange({ name: event.target.value });
          }}
        />
        {calculated.isWorstCase && (
          <span className="text-muted-foreground mt-0.5 block text-[0.6875rem]">
            Sets the worst case
          </span>
        )}
      </td>

      <td className="py-2 pr-2">
        <NumberField
          isValid={(value) => creditsPerExecutionSchema.safeParse(value).success}
          label={`Credits per action for ${calculated.name}`}
          min={MINIMUM_CREDITS}
          showLabel={false}
          step={WHOLE_STEP}
          value={calculated.creditsPerExecution}
          onChange={(creditsPerExecution) => onChange({ creditsPerExecution })}
        />
      </td>

      <td className="py-2 pr-2">
        <NumberField
          isValid={(value) => quantitySchema.safeParse(value).success}
          label={`Expected runs for ${calculated.name}`}
          min={MINIMUM}
          showLabel={false}
          step={WHOLE_STEP}
          value={calculated.quantity}
          onChange={(quantity) => onChange({ quantity })}
        />
      </td>

      <td className="py-2 pr-2">
        <NumberField
          isValid={(value) => tokenCountSchema.safeParse(value).success}
          label={`Input tokens for ${calculated.name}`}
          min={MINIMUM}
          showLabel={false}
          step={TOKEN_STEP}
          value={calculated.inputTokens}
          onChange={(inputTokens) => onChange({ inputTokens })}
        />
      </td>

      <td className="py-2 pr-2">
        <NumberField
          isValid={(value) => tokenCountSchema.safeParse(value).success}
          label={`Output tokens for ${calculated.name}`}
          min={MINIMUM}
          showLabel={false}
          step={TOKEN_STEP}
          value={calculated.outputTokens}
          onChange={(outputTokens) => onChange({ outputTokens })}
        />
      </td>

      <td className="py-2 pr-2">
        <NumberField
          isValid={(value) => fixedCostPerExecutionSchema.safeParse(value).success}
          label={`Fixed cost per action for ${calculated.name}`}
          min={MINIMUM}
          showLabel={false}
          step={COST_STEP}
          value={feature.fixedCostPerExecution}
          onChange={(fixedCostPerExecution) => onChange({ fixedCostPerExecution })}
        />
        {calculated.fixedCostName != null && (
          <span className="text-muted-foreground mt-0.5 block text-[0.6875rem]">
            {calculated.fixedCostName}
          </span>
        )}
      </td>

      <td className="py-2 pr-2 text-right font-mono tabular-nums">
        {format.unitMoney(calculated.costPerExecution)}
      </td>
      <td className="py-2 pr-2 text-right font-mono tabular-nums">
        {format.unitMoney(calculated.costPerCredit)}
      </td>
      <td className="py-2 pr-2 text-right font-mono tabular-nums">
        {format.money(calculated.totalCost)}
      </td>
      <td className="py-2 pr-2 text-right font-mono tabular-nums">
        {format.count(calculated.totalCredits)}
      </td>

      <td className="py-2 text-right">
        <Button
          aria-label={`Remove ${calculated.name}`}
          size="icon"
          type="button"
          variant="ghost"
          onClick={onRemove}
        >
          <Trash2 aria-hidden="true" size={ICON_SIZE} />
        </Button>
      </td>
    </tr>
  );
}
