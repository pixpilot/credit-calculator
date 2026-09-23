import type { CreditFeature, CreditUsage } from '@pixpilot/credit-usage-calculator';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CreditCalculator, PLANNING_VIEW, SPENDING_VIEW } from '../src';

const features: readonly CreditFeature[] = [
  { id: 'analysis', label: 'AI Analysis', creditCost: 5 },
  { id: 'document', label: 'Document generation', creditCost: 25 },
  { id: 'message', label: 'AI message', creditCost: 1 },
];

/*
 * The shared shadcn slider builds its own thumb, so the control carries no name
 * of its own; the labelled section around it is what identifies the feature to
 * a screen reader, and so is what a test has to go through to reach it.
 */
function featureSlider(label: string): HTMLElement {
  return within(screen.getByRole('region', { name: label })).getByRole('slider');
}

const creditBalanceInput = (): HTMLElement => screen.getByLabelText('Credits');

const presets = [
  {
    id: 'casual',
    label: 'Casual',
    usage: [{ featureId: 'analysis', quantity: 10 }],
  },
  {
    id: 'active',
    label: 'Active',
    isDefault: true,
    usage: [
      { featureId: 'analysis', quantity: 20 },
      { featureId: 'message', quantity: 40 },
    ],
  },
];

function presetChoice(name: string): HTMLElement {
  return within(screen.getByRole('radiogroup', { name: 'Example usage' })).getByRole(
    'radio',
    { name },
  );
}

function viewChoice(name: string): HTMLElement {
  return within(screen.getByRole('radiogroup', { name: 'Calculator view' })).getByRole(
    'radio',
    { name },
  );
}

describe('creditCalculator', () => {
  it('should total what every configured feature would cost in the All features view', () => {
    render(
      <CreditCalculator
        features={features}
        initialUsage={[
          { featureId: 'analysis', quantity: 10 },
          { featureId: 'message', quantity: 5 },
        ]}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /how many credits do you need/iu }),
    ).toBeInTheDocument();
    expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuenow', '10');
    expect(featureSlider('Document generation')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByText('55')).toBeInTheDocument();
  });

  /*
   * The planning view is sizing a purchase, not spending an allowance, so no
   * balance may reach it: neither a field to set one nor a verdict on whether
   * the plan fits inside one.
   */
  it('should offer no balance at all while planning a purchase', () => {
    render(
      <CreditCalculator
        features={features}
        initialUsage={[{ featureId: 'document', quantity: 40 }]}
      />,
    );

    expect(screen.queryByLabelText('Credits')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('should run every planning slider to the same stated limit', () => {
    render(<CreditCalculator features={features} plannedQuantityLimit={40} />);

    expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuemax', '40');
    expect(featureSlider('Document generation')).toHaveAttribute('aria-valuemax', '40');
  });

  describe('view switch', () => {
    /*
     * The two views are different calculators, so the control that picks one is
     * not the control that picks a feature: only the spending view has a single
     * feature to focus on, and only it may offer the select.
     */
    it('should offer a feature select in the spending view alone', () => {
      render(<CreditCalculator features={features} />);

      expect(screen.queryByLabelText('Feature')).not.toBeInTheDocument();

      fireEvent.click(viewChoice('Spend credits'));

      expect(screen.getByLabelText('Feature')).toBeInTheDocument();
    });

    it('should never offer the planning view as a feature to select', () => {
      render(
        <CreditCalculator features={features} initialSelectedFeatureId="analysis" />,
      );

      fireEvent.click(screen.getByLabelText('Feature'));

      expect(
        screen.queryByRole('option', { name: /all features/iu }),
      ).not.toBeInTheDocument();
      expect(screen.getAllByRole('option')).toHaveLength(features.length);
    });

    it('should swap the balance for a running total when planning is picked', () => {
      render(
        <CreditCalculator features={features} initialSelectedFeatureId="analysis" />,
      );

      fireEvent.click(viewChoice('Plan usage'));

      expect(screen.queryByLabelText('Credits')).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: /how many credits do you need/iu }),
      ).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'AI message' })).toBeInTheDocument();
    });

    /*
     * A view switch is a change of question, not of subject: returning to the
     * spending view has to land back on the feature being read about.
     */
    it('should return to the feature the spending view was left on', () => {
      render(
        <CreditCalculator features={features} initialSelectedFeatureId="document" />,
      );

      fireEvent.click(viewChoice('Plan usage'));
      fireEvent.click(viewChoice('Spend credits'));

      expect(
        screen.getByRole('region', { name: 'Document generation' }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'AI message' }),
      ).not.toBeInTheDocument();
    });

    /** Nothing has been read about yet, so the first feature is the subject. */
    it('should open the spending view on the first feature when none was chosen', () => {
      const onSelectedFeatureChange = vi.fn();

      render(
        <CreditCalculator
          features={features}
          onSelectedFeatureChange={onSelectedFeatureChange}
        />,
      );

      fireEvent.click(viewChoice('Spend credits'));

      expect(onSelectedFeatureChange).toHaveBeenLastCalledWith('analysis');
      expect(screen.getByRole('region', { name: 'AI Analysis' })).toBeInTheDocument();
    });

    /*
     * A host that offers one of the two calculators has already answered the
     * switch's question, so the visitor is not shown it being asked.
     */
    it('should hide the switch when a single view is offered', () => {
      render(<CreditCalculator features={features} views={[PLANNING_VIEW]} />);

      expect(
        screen.queryByRole('radiogroup', { name: 'Calculator view' }),
      ).not.toBeInTheDocument();
    });

    /** The only offered view is the one the calculator is in, selection or not. */
    it('should stay in the offered view when the other one is asked for', () => {
      render(
        <CreditCalculator
          features={features}
          views={[PLANNING_VIEW]}
          initialSelectedFeatureId="analysis"
        />,
      );

      expect(screen.queryByLabelText('Credits')).not.toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'AI message' })).toBeInTheDocument();
    });

    it('should open on the spending view when planning is not offered', () => {
      render(<CreditCalculator features={features} views={[SPENDING_VIEW]} />);

      expect(creditBalanceInput()).toBeInTheDocument();
      expect(screen.getByRole('region', { name: 'AI Analysis' })).toBeInTheDocument();
      expect(
        screen.queryByRole('region', { name: 'AI message' }),
      ).not.toBeInTheDocument();
    });
  });

  it('should show one feature and remaining equivalents in a focused view', () => {
    render(
      <CreditCalculator
        credits={100}
        features={features}
        initialSelectedFeatureId="analysis"
        initialUsage={[{ featureId: 'analysis', quantity: 10 }]}
      />,
    );

    expect(featureSlider('AI Analysis')).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Document generation' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('With your remaining 50 credits:')).toBeInTheDocument();
    expect(screen.getByText('2 Document generation')).toBeInTheDocument();
    expect(screen.getByText('50 AI message')).toBeInTheDocument();
  });

  it('should update uncontrolled usage and notify consumers when a slider changes', () => {
    const onUsageChange = vi.fn();

    render(
      <CreditCalculator
        credits={20}
        features={features}
        initialSelectedFeatureId="analysis"
        onUsageChange={onUsageChange}
      />,
    );

    fireEvent.keyDown(featureSlider('AI Analysis'), { key: 'ArrowRight' });

    expect(onUsageChange).toHaveBeenLastCalledWith([
      { featureId: 'analysis', quantity: 1 },
    ]);
    expect(screen.getByText('5 / 20')).toBeInTheDocument();
  });

  it('should leave a controlled quantity unchanged until the consumer updates it', () => {
    const usage: readonly CreditUsage[] = [{ featureId: 'analysis', quantity: 1 }];
    const onUsageChange = vi.fn();

    render(
      <CreditCalculator
        credits={20}
        features={features}
        initialSelectedFeatureId="analysis"
        usage={usage}
        onUsageChange={onUsageChange}
      />,
    );

    fireEvent.keyDown(featureSlider('AI Analysis'), { key: 'ArrowRight' });

    expect(onUsageChange).toHaveBeenLastCalledWith([
      { featureId: 'analysis', quantity: 2 },
    ]);
    expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuenow', '1');
  });

  it('should clearly surface an over-budget selection', () => {
    render(
      <CreditCalculator
        credits={20}
        features={features}
        initialSelectedFeatureId="document"
        initialUsage={[{ featureId: 'document', quantity: 1 }]}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('5 credits over your balance');
    expect(screen.getByText('25 / 20')).toBeInTheDocument();
  });

  describe('usage presets', () => {
    /* An empty planning view asks the question the visitor came to have
       answered, so it opens on the example marked as the default. */
    it('should open the planning view on the default example', () => {
      render(<CreditCalculator features={features} usagePresets={presets} />);

      expect(presetChoice('Active')).toHaveAttribute('aria-checked', 'true');
      expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuenow', '20');
      expect(featureSlider('AI message')).toHaveAttribute('aria-valuenow', '40');
      expect(screen.getByText('140')).toBeInTheDocument();
    });

    it('should let a consumer state quantities the examples may not overrule', () => {
      render(
        <CreditCalculator
          features={features}
          usagePresets={presets}
          initialUsage={[{ featureId: 'document', quantity: 2 }]}
        />,
      );

      expect(featureSlider('Document generation')).toHaveAttribute('aria-valuenow', '2');
      expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuenow', '0');
    });

    it('should fill every slider from the example that is picked', () => {
      const onUsageChange = vi.fn();

      render(
        <CreditCalculator
          features={features}
          usagePresets={presets}
          onUsageChange={onUsageChange}
        />,
      );

      fireEvent.click(presetChoice('Casual'));

      expect(onUsageChange).toHaveBeenLastCalledWith([
        { featureId: 'analysis', quantity: 10 },
      ]);
      expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuenow', '10');
      // Everything the example leaves out is left out, not left behind from
      // whichever example was on screen before it.
      expect(featureSlider('AI message')).toHaveAttribute('aria-valuenow', '0');
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    /* An example is a starting point, not a mode: once a slider moves, the plan
       on screen is the visitor's own and no example may claim it. */
    it('should claim no example once a slider is moved', () => {
      render(<CreditCalculator features={features} usagePresets={presets} />);

      fireEvent.keyDown(featureSlider('AI Analysis'), { key: 'ArrowRight' });

      expect(presetChoice('Active')).toHaveAttribute('aria-checked', 'false');
      expect(presetChoice('Casual')).toHaveAttribute('aria-checked', 'false');
    });

    it('should restore an example after the sliders have been edited', () => {
      render(<CreditCalculator features={features} usagePresets={presets} />);

      fireEvent.keyDown(featureSlider('AI Analysis'), { key: 'ArrowRight' });
      fireEvent.click(presetChoice('Active'));

      expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuenow', '20');
      expect(presetChoice('Active')).toHaveAttribute('aria-checked', 'true');
    });

    /* The spending view measures one feature against a balance; a whole month
       of every feature is not a starting point for that question. */
    it('should offer no examples in the spending view', () => {
      render(<CreditCalculator features={features} usagePresets={presets} />);

      fireEvent.click(viewChoice('Spend credits'));

      expect(
        screen.queryByRole('radiogroup', { name: 'Example usage' }),
      ).not.toBeInTheDocument();
      expect(screen.getByLabelText('Feature')).toBeInTheDocument();
    });
  });

  describe('credit balance', () => {
    it('should open on a stated default balance the visitor can see', () => {
      render(
        <CreditCalculator features={features} initialSelectedFeatureId="analysis" />,
      );

      expect(creditBalanceInput()).toHaveValue(500);
      expect(
        screen.getByRole('heading', { name: /how far can 500 credits take you/iu }),
      ).toBeInTheDocument();
    });

    it('should recalculate every slider against an edited balance', () => {
      const onCreditsChange = vi.fn();

      render(
        <CreditCalculator
          features={features}
          initialCredits={100}
          initialSelectedFeatureId="analysis"
          initialUsage={[{ featureId: 'analysis', quantity: 10 }]}
          onCreditsChange={onCreditsChange}
        />,
      );

      fireEvent.change(creditBalanceInput(), { target: { value: '200' } });

      expect(onCreditsChange).toHaveBeenLastCalledWith(200);
      expect(screen.getByText('50 / 200')).toBeInTheDocument();
      // The reach of the balance is what the slider measures, so raising it
      // has to lengthen the track rather than only move the running total.
      expect(featureSlider('AI Analysis')).toHaveAttribute('aria-valuemax', '40');
    });

    /*
     * An edited balance never retracts a slider's existing useful range: the
     * visitor can still choose an action and see that it exceeds the balance.
     */
    it('should preserve the slider range when a balance affords nothing', () => {
      render(
        <CreditCalculator
          features={features}
          initialCredits={100}
          initialSelectedFeatureId="document"
        />,
      );

      fireEvent.change(creditBalanceInput(), { target: { value: '' } });

      expect(creditBalanceInput()).toHaveValue(0);
      expect(featureSlider('Document generation')).toHaveAttribute('aria-valuemax', '4');
    });

    it('should leave a controlled balance to its consumer', () => {
      const onCreditsChange = vi.fn();

      render(
        <CreditCalculator
          credits={100}
          features={features}
          initialSelectedFeatureId="analysis"
          onCreditsChange={onCreditsChange}
        />,
      );

      fireEvent.change(creditBalanceInput(), { target: { value: '250' } });

      expect(onCreditsChange).toHaveBeenLastCalledWith(250);
      expect(creditBalanceInput()).toHaveValue(100);
    });
  });
});
