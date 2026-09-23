'use client';

import type { CreditPackagePricingSettings } from '@pixpilot/credit-package-margin-calculator';
import type { ReactNode } from 'react';

import {
  MAX_USD_AMOUNT,
  STRIPE_FIXED_FEE_USD,
  STRIPE_PERCENTAGE_RATE,
} from '@pixpilot/credit-package-margin-calculator';
import { Label, Switch } from '@pixpilot/shadcn';
import { SliderInput } from '@pixpilot/shadcn-ui';
import { useId } from 'react';
import { formatPercent, formatUsd } from '../utils/format-number.ts';
import { CalculatorSection } from './CalculatorSection.tsx';
import { NumericCell } from './NumericCell.tsx';

const TOKEN_PRICE_STEP = 0.01;
const MARGIN_STEP = 1;
const MINIMUM_TARGET_MARGIN = 50;
const MAXIMUM_TARGET_MARGIN = 95;
const PERCENT = 100;

export interface PricingAssumptionsPanelProps {
  settings: CreditPackagePricingSettings;
  onSettingsChange: (settings: CreditPackagePricingSettings) => void;
}

/**
 * The three assumptions every figure below is priced against: what the model
 * charges, what margin we are aiming at, and whether the payment processor's
 * cut comes out of revenue first.
 */
export function PricingAssumptionsPanel({
  onSettingsChange,
  settings,
}: PricingAssumptionsPanelProps): ReactNode {
  const stripeId = useId();

  return (
    <CalculatorSection title="Assumptions">
      <div className="grid gap-x-6 gap-y-4 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <AssumptionField label="Input $ / 1M tokens">
          <NumericCell
            label="Input price per million tokens"
            maximum={MAX_USD_AMOUNT}
            step={TOKEN_PRICE_STEP}
            value={settings.inputPricePerMillionTokens}
            onCommit={(inputPricePerMillionTokens) => {
              onSettingsChange({ ...settings, inputPricePerMillionTokens });
            }}
          />
        </AssumptionField>

        <AssumptionField label="Output $ / 1M tokens">
          <NumericCell
            label="Output price per million tokens"
            maximum={MAX_USD_AMOUNT}
            step={TOKEN_PRICE_STEP}
            value={settings.outputPricePerMillionTokens}
            onCommit={(outputPricePerMillionTokens) => {
              onSettingsChange({ ...settings, outputPricePerMillionTokens });
            }}
          />
        </AssumptionField>

        <AssumptionField label="Target margin %">
          <SliderInput
            input={{
              'aria-label': 'Target margin',
              className: 'h-7 w-16 rounded-none font-mono text-xs tabular-nums',
            }}
            max={MAXIMUM_TARGET_MARGIN}
            min={MINIMUM_TARGET_MARGIN}
            slider={{ className: 'w-full' }}
            step={MARGIN_STEP}
            value={[settings.targetMargin]}
            onValueChange={([targetMargin]) => {
              if (isTargetMargin(targetMargin)) {
                onSettingsChange({ ...settings, targetMargin });
              }
            }}
          />
        </AssumptionField>

        <AssumptionField label="Processor fee">
          <div className="flex h-7 items-center gap-3">
            <Switch
              checked={settings.stripeFeesEnabled}
              id={stripeId}
              onCheckedChange={(stripeFeesEnabled) => {
                onSettingsChange({ ...settings, stripeFeesEnabled });
              }}
            />
            <Label
              className="text-muted-foreground font-mono text-xs font-normal tabular-nums"
              htmlFor={stripeId}
            >
              {formatPercent(STRIPE_PERCENTAGE_RATE * PERCENT)} +{' '}
              {formatUsd(STRIPE_FIXED_FEE_USD)} per sale
            </Label>
          </div>
        </AssumptionField>
      </div>
    </CalculatorSection>
  );
}

/**
 * The slider reports whatever its input was typed as, and the calculation
 * rejects a margin outside its own bounds rather than pricing it, so a value
 * from outside the track is dropped here.
 */
function isTargetMargin(value: number | undefined): value is number {
  return (
    value != null && value >= MINIMUM_TARGET_MARGIN && value <= MAXIMUM_TARGET_MARGIN
  );
}

function AssumptionField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}): ReactNode {
  return (
    <div className="space-y-1.5">
      <span className="text-muted-foreground block text-[0.6875rem] tracking-[0.08em] uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}
