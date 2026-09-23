'use client';

import type { ReactNode } from 'react';
import type { CreditCalculatorView } from './credit-calculator-view';
import type { CreditCalculatorProps, CreditUsagePreset } from './types';
import { calculateCreditUsage } from '@pixpilot/credit-usage-calculator';
import { Card, CardContent, CardHeader, CardTitle, cn } from '@pixpilot/shadcn';
import { useCreditCalculatorState } from '../../hooks/use-credit-calculator-state';
import { PLANNING_VIEW, SPENDING_VIEW } from './credit-calculator-view';
import { CreditBalanceInput } from './CreditBalanceInput';
import { CreditCalculatorSummary } from './CreditCalculatorSummary';
import { CreditCalculatorViewSwitch } from './CreditCalculatorViewSwitch';
import { CreditsNeededTotal } from './CreditsNeededTotal';
import { FeatureSelector } from './FeatureSelector';
import { FeatureUsageSlider } from './FeatureUsageSlider';
import { RemainingEquivalents } from './RemainingEquivalents';
import { matchUsagePresetId } from './usage-presets';
import { UsagePresetSwitch } from './UsagePresetSwitch';

/**
 * How far each slider runs when there is no balance to measure it against.
 * Uniform across features, so the sliders read as one scale of "how much do I
 * plan to do" rather than each on a scale of its own price.
 */
const DEFAULT_PLANNED_QUANTITY_LIMIT = 200;

/** A calculator offered no worked examples simply opens on empty sliders. */
const NO_USAGE_PRESETS: readonly CreditUsagePreset[] = [];

/** Both questions, for a host that has not said which it wants asked. */
const ALL_VIEWS: readonly CreditCalculatorView[] = [PLANNING_VIEW, SPENDING_VIEW];

/**
 * An interactive, generic calculator for a user's credits, in two readings.
 *
 * The spending view asks: this much balance, how far does one feature go, and
 * what else would the remainder cover. The planning view asks the buying
 * question instead — set out everything you expect to do and see what it comes
 * to — so it has no balance at all: a budget there would only cap the plan the
 * visitor is trying to size, and call it "over" when they planned more than a
 * figure they never chose.
 *
 * That is why the balance field belongs to one view and the running total to
 * the other, and why the feature select appears in only one of them; they
 * answer different questions from the same sliders.
 */
export function CreditCalculator({
  credits,
  initialCredits,
  onCreditsChange,
  features,
  usage,
  initialUsage,
  onUsageChange,
  usagePresets = NO_USAGE_PRESETS,
  views = ALL_VIEWS,
  selectedFeatureId,
  initialSelectedFeatureId,
  onSelectedFeatureChange,
  plannedQuantityLimit = DEFAULT_PLANNED_QUANTITY_LIMIT,
  title,
  className,
}: CreditCalculatorProps): ReactNode {
  /*
   * An empty planning view asks the visitor the question they came to have
   * answered, so it opens on a worked example instead — unless the consumer
   * stated its quantities itself, which is a plan of its own.
   */
  const defaultPreset = usagePresets.find((preset) => preset.isDefault);
  const {
    activeCredits,
    activeFeatureId,
    spendingFeatureId,
    currentUsage,
    changeCredits,
    changeQuantity,
    changeUsage,
    changeSelectedFeature,
  } = useCreditCalculatorState({
    featureIds: features.map((feature) => feature.id),
    credits,
    initialCredits,
    onCreditsChange,
    usage,
    initialUsage: initialUsage ?? defaultPreset?.usage,
    onUsageChange,
    selectedFeatureId,
    initialSelectedFeatureId,
    onSelectedFeatureChange,
  });
  const result = calculateCreditUsage({
    credits: activeCredits,
    features,
    usage: currentUsage,
  });
  /*
   * A host offering one of the two calculators has answered the switch's
   * question on the visitor's behalf, so that view is the only one the
   * calculator can be put into, whatever feature was selected. An empty list
   * states no preference rather than an impossible one.
   */
  const offeredViews = views.length > 0 ? views : ALL_VIEWS;
  const canSpend = offeredViews.includes(SPENDING_VIEW);
  const requestedFeatureId = offeredViews.includes(PLANNING_VIEW)
    ? activeFeatureId
    : spendingFeatureId;
  const selectedFeature = result.features.find(
    (feature) => feature.id === (canSpend ? requestedFeatureId : null),
  );
  // One feature is the spending view; every feature is the planning view.
  const isSpendingView = selectedFeature !== undefined;
  const displayedFeatures =
    selectedFeature === undefined ? result.features : [selectedFeature];
  const equivalents =
    selectedFeature === undefined
      ? result.equivalents
      : result.equivalents.filter(
          (equivalent) => equivalent.featureId !== selectedFeature.id,
        );

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-4">
        {/* The heading states the question; the switch beside it is how the
            question is changed. Keeping them on one line makes the switch read
            as the control over the title rather than as one more setting in the
            row of settings below. */}
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row sm:flex-wrap">
          <CardTitle>
            <h2>
              {title ??
                (isSpendingView
                  ? `How far can ${activeCredits} credits take you?` //
                  : 'How many credits do you need?')}
            </h2>
          </CardTitle>
          {/* Nothing to spend on and nothing to plan: with no features
              configured the two views are the same empty calculator. */}
          {features.length > 0 && offeredViews.length > 1 && (
            <div className="flex justify-center sm:justify-end">
              <CreditCalculatorViewSwitch
                view={isSpendingView ? SPENDING_VIEW : PLANNING_VIEW}
                views={offeredViews}
                onViewChange={(nextView) => {
                  changeSelectedFeature(
                    nextView === SPENDING_VIEW ? spendingFeatureId : null,
                  );
                }}
              />
            </div>
          )}
        </div>
        {/* Then the settings that question needs: what is being measured, and
            the figure it turns on — the balance being spent, or the total being
            built up. The auto margin keeps that figure at the right edge in the
            view that has no feature to select beside it. */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Which action is being measured, or — when every action is — where
              to start measuring from. Each view's own way in to the sliders. */}
          {selectedFeature === undefined ? (
            usagePresets.length > 0 && (
              <UsagePresetSwitch
                presets={usagePresets}
                selectedPresetId={matchUsagePresetId(usagePresets, currentUsage)}
                onPresetSelected={(preset) => changeUsage(preset.usage)}
              />
            )
          ) : (
            <FeatureSelector
              features={features}
              selectedFeatureId={selectedFeature.id}
              onSelectedFeatureChange={changeSelectedFeature}
            />
          )}
          <div className="sm:ml-auto">
            {isSpendingView ? (
              <CreditBalanceInput
                credits={activeCredits}
                onCreditsChange={changeCredits}
              />
            ) : (
              <CreditsNeededTotal credits={result.usedCredits} />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-5">
          {displayedFeatures.map((feature) => (
            <FeatureUsageSlider
              key={feature.id}
              feature={feature}
              maxQuantity={
                isSpendingView ? feature.maxQuantityFromTotal : plannedQuantityLimit
              }
              onQuantityChange={(quantity) => changeQuantity(feature.id, quantity)}
            />
          ))}
        </div>

        {/* Used, remaining and over-budget are all measured against a balance,
            so they belong to the view that has one. The planning view's answer
            is already stated above the sliders. */}
        {isSpendingView && (
          <>
            <CreditCalculatorSummary result={result} />
            <RemainingEquivalents
              remainingCredits={result.remainingCredits}
              equivalents={equivalents}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
