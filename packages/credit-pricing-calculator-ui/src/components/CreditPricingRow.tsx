'use client';

import type { Money } from '@pixpilot/cost-calculator';
import type {
  CalculatedCreditPricingFeature,
  CreditPricingFeature,
} from '@pixpilot/credit-pricing-calculator';
import type { ReactNode } from 'react';

import {
  creditsPerExecutionSchema,
  moneySchema,
} from '@pixpilot/credit-pricing-calculator';
import { Input } from '@pixpilot/shadcn-ui';
import { useState } from 'react';
import { formatPercent, formatUnitUsd } from '../utils/format-money.ts';

const CREDITS_STEP = 1;
const MINIMUM_CREDITS = 0;
const NO_DRAFT = null;

export interface CreditPricingRowProps {
  feature: CalculatedCreditPricingFeature;
  onChange: (changes: Partial<CreditPricingFeature>) => void;
  /**
   * `false` when the host derives the cost itself, so the figure is reported
   * rather than offered as an input whose edits would be discarded.
   */
  providerCostEditable?: boolean | undefined;
}

/**
 * One feature: the two figures an administrator owns, and the per-credit cost
 * they produce.
 *
 * Both controls report only values the calculator accepts, because it
 * validates its input and throws on anything else — a half-typed `0.` or a
 * pasted `-5` has to be rejected here rather than being allowed to tear down
 * the screen it was typed into.
 *
 * The cost is edited as text rather than as a number input so the amount stays
 * exact: a provider cost of `0.0000005` is a real figure on this screen, and
 * routing it through a number control is how it becomes `5e-7` — or worse,
 * rounded away.
 *
 * A host that calculates the cost itself reports it read-only instead. An
 * input whose edits are overwritten on the next render is worse than no input:
 * it invites a change it silently refuses to keep.
 */
export function CreditPricingRow({
  feature,
  onChange,
  providerCostEditable = true,
}: CreditPricingRowProps): ReactNode {
  const [costDraft, setCostDraft] = useState<string | null>(NO_DRAFT);

  return (
    <tr
      className={`border-border border-t align-top ${feature.enabled ? '' : 'opacity-50'}`}
    >
      <td className="max-w-40 py-3 pr-3" title={feature.label}>
        <span className="block truncate font-medium">{feature.label}</span>
        {feature.isPriceSetting && (
          <span className="text-muted-foreground block text-[0.6875rem]">
            Sets the credit price
          </span>
        )}
      </td>

      <td className="py-3 pr-3">
        {providerCostEditable ? (
          <Input
            aria-label={`Provider cost per execution for ${feature.label}`}
            className="w-full text-right font-mono tabular-nums"
            inputMode="decimal"
            type="text"
            value={costDraft ?? feature.providerCostPerExecution.amount}
            onBlur={() => setCostDraft(NO_DRAFT)}
            onChange={(event) => {
              const amount = event.target.value;
              setCostDraft(amount);

              const providerCostPerExecution: Money = { amount, currency: 'USD' };

              if (moneySchema.safeParse(providerCostPerExecution).success) {
                onChange({ providerCostPerExecution });
              }
            }}
          />
        ) : (
          <span className="block text-right font-mono tabular-nums">
            {formatUnitUsd(feature.providerCostPerExecution)}
          </span>
        )}
      </td>

      <td className="py-3 pr-3">
        <Input
          aria-label={`Credits per execution for ${feature.label}`}
          className="w-full text-right font-mono tabular-nums"
          min={MINIMUM_CREDITS}
          step={CREDITS_STEP}
          type="number"
          value={feature.creditsPerExecution}
          onChange={(event) => {
            const creditsPerExecution = Number(event.target.value);

            if (
              event.target.value !== '' &&
              creditsPerExecutionSchema.safeParse(creditsPerExecution).success
            ) {
              onChange({ creditsPerExecution });
            }
          }}
        />
      </td>

      <td className="py-3 pr-3 text-right font-mono tabular-nums">
        {formatUnitUsd(feature.providerCostPerCredit)}
      </td>

      <td className="py-3 text-right font-mono tabular-nums">
        {formatPercent(feature.marginAtCalculatedCreditPrice)}
      </td>
    </tr>
  );
}
