'use client';

import type {
  CreditPricingAssumptions,
  CreditPricingAssumptionsInput,
} from '@pixpilot/credit-package-sizing-calculator';
import type { ReactNode } from 'react';

import { creditPricingAssumptionsSchema } from '@pixpilot/credit-package-sizing-calculator';
import { Card, CardContent } from '@pixpilot/shadcn-ui';

import { NumberField } from './NumberField.tsx';

const PRICE_STEP = 0.01;
const RATE_STEP = 0.05;
const PERCENT_STEP = 0.5;
const CREDIT_STEP = 25;
const WHOLE_STEP = 1;
const MINIMUM = 0;

const FIELDS = creditPricingAssumptionsSchema.shape;

export interface CreditPricingAssumptionsFormProps {
  assumptions: CreditPricingAssumptions;
  onChange: (changes: Partial<CreditPricingAssumptionsInput>) => void;
}

/**
 * Everything the features are priced against, in one editable panel.
 *
 * The four figures that decide the answer sit together rather than being
 * spread across the screen, because an administrator sweeping a target margin
 * is really asking what the buffer, the price and the credits do together, and
 * the only way to see that is to change one with the other three in view.
 *
 * The three settings below the fold are the ones that shape a recommendation
 * rather than the economics: the increment a package is rounded to, what
 * counts as a standard action, and how far short of the safe maximum a
 * suggestion deliberately stops. They are inputs, not constants baked into the
 * calculation, so the strategy they encode can be argued with.
 */
export function CreditPricingAssumptionsForm({
  assumptions,
  onChange,
}: CreditPricingAssumptionsFormProps): ReactNode {
  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div>
          <h3 className="text-sm font-semibold">Model &amp; pricing assumptions</h3>
          <p className="text-muted-foreground text-xs">
            Token rates, the package on sale, and the margin it has to hold.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-2">
          <NumberField
            isValid={(value) => FIELDS.inputCostPerMillionTokens.safeParse(value).success}
            label="Input price / 1M tokens"
            min={MINIMUM}
            step={RATE_STEP}
            value={assumptions.inputCostPerMillionTokens}
            onChange={(inputCostPerMillionTokens) =>
              onChange({ inputCostPerMillionTokens })
            }
          />
          <NumberField
            isValid={(value) =>
              FIELDS.outputCostPerMillionTokens.safeParse(value).success
            }
            label="Output price / 1M tokens"
            min={MINIMUM}
            step={RATE_STEP}
            value={assumptions.outputCostPerMillionTokens}
            onChange={(outputCostPerMillionTokens) =>
              onChange({ outputCostPerMillionTokens })
            }
          />
          <NumberField
            isValid={(value) => FIELDS.packagePrice.safeParse(value).success}
            label="Package price"
            min={MINIMUM}
            step={PRICE_STEP}
            value={assumptions.packagePrice}
            onChange={(packagePrice) => onChange({ packagePrice })}
          />
          <NumberField
            isValid={(value) => FIELDS.currentPackageCredits.safeParse(value).success}
            label="Current package credits"
            min={MINIMUM}
            step={CREDIT_STEP}
            value={assumptions.currentPackageCredits}
            onChange={(currentPackageCredits) => onChange({ currentPackageCredits })}
          />
          <NumberField
            isValid={(value) => FIELDS.targetGrossMarginPercent.safeParse(value).success}
            label="Target gross margin"
            min={MINIMUM}
            step={PERCENT_STEP}
            suffix="%"
            value={assumptions.targetGrossMarginPercent}
            onChange={(targetGrossMarginPercent) =>
              onChange({ targetGrossMarginPercent })
            }
          />
          <NumberField
            isValid={(value) => FIELDS.safetyBufferPercent.safeParse(value).success}
            label="Safety buffer"
            min={MINIMUM}
            step={PERCENT_STEP}
            suffix="%"
            value={assumptions.safetyBufferPercent}
            onChange={(safetyBufferPercent) => onChange({ safetyBufferPercent })}
          />
          <NumberField
            isValid={(value) =>
              FIELDS.subscriptionCreditBonusPercent.safeParse(value).success
            }
            label="Subscription credit bonus"
            min={MINIMUM}
            step={PERCENT_STEP}
            suffix="%"
            value={assumptions.subscriptionCreditBonusPercent}
            onChange={(subscriptionCreditBonusPercent) =>
              onChange({ subscriptionCreditBonusPercent })
            }
          />
          <NumberField
            isValid={(value) => FIELDS.freeCreditsPerWeek.safeParse(value).success}
            label="Free credits / week"
            min={MINIMUM}
            step={WHOLE_STEP}
            value={assumptions.freeCreditsPerWeek}
            onChange={(freeCreditsPerWeek) => onChange({ freeCreditsPerWeek })}
          />
        </div>

        <div className="border-border space-y-3 border-t pt-3">
          <p className="text-muted-foreground text-xs font-medium">
            Recommendation settings
          </p>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <NumberField
              isValid={(value) => FIELDS.creditPackageIncrement.safeParse(value).success}
              label="Package increment"
              min={WHOLE_STEP}
              step={WHOLE_STEP}
              value={assumptions.creditPackageIncrement}
              onChange={(creditPackageIncrement) => onChange({ creditPackageIncrement })}
            />
            <NumberField
              isValid={(value) => FIELDS.standardActionCredits.safeParse(value).success}
              label="Standard action credits"
              min={WHOLE_STEP}
              step={WHOLE_STEP}
              value={assumptions.standardActionCredits}
              onChange={(standardActionCredits) => onChange({ standardActionCredits })}
            />
            <NumberField
              isValid={(value) =>
                FIELDS.recommendationHeadroomPercent.safeParse(value).success
              }
              label="Recommendation headroom"
              min={MINIMUM}
              step={PERCENT_STEP}
              suffix="%"
              value={assumptions.recommendationHeadroomPercent}
              onChange={(recommendationHeadroomPercent) =>
                onChange({ recommendationHeadroomPercent })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
