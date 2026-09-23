import type { CreditPricingFeature } from '@pixpilot/credit-pricing-calculator';

import { createCreditPricingFeatures } from '@pixpilot/credit-pricing-calculator';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CreditPricingCalculator } from '../src/index.ts';
import { formatPercent, formatUnitUsd } from '../src/utils/format-money.ts';

const defaultValue: CreditPricingFeature[] = [
  {
    creditsPerExecution: 5,
    id: 'insights',
    label: 'Job Insights',
    providerCostPerExecution: { amount: '0.002852', currency: 'USD' },
  },
  {
    creditsPerExecution: 1,
    id: 'resume-export',
    label: 'Resume Export',
    providerCostPerExecution: { amount: '0.0005', currency: 'USD' },
  },
];

function figure(label: string): string {
  const container = screen.getByText(label).parentElement;

  return container?.lastElementChild?.textContent ?? '';
}

function costInput(label: string): HTMLElement {
  return screen.getByLabelText(`Provider cost per execution for ${label}`);
}

function creditsInput(label: string): HTMLElement {
  return screen.getByLabelText(`Credits per execution for ${label}`);
}

function row(label: string): HTMLElement {
  const cell = within(screen.getByRole('table')).getByText(label).closest('tr');

  if (cell == null) throw new Error(`No row for "${label}"`);

  return cell;
}

describe('credit pricing calculator', () => {
  it('should render every dynamically supplied feature with both controls', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    expect(costInput('Job Insights')).toHaveValue('0.002852');
    expect(creditsInput('Job Insights')).toHaveValue(5);
    expect(costInput('Resume Export')).toHaveValue('0.0005');
    expect(creditsInput('Resume Export')).toHaveValue(1);
  });

  it('should show the price the calculator produced for one credit', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    expect(figure('Minimum credit price')).toBe('$0.002852');
    expect(figure('Worst-case provider cost / credit')).toBe('$0.00057');
    expect(figure('Price-setting feature')).toBe('Job Insights');
  });

  it('should show each feature cost per credit and margin on its own row', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    const insights = row('Job Insights');

    expect(within(insights).getByText('Sets the credit price')).toBeDefined();
    expect(within(insights).getByText('$0.00057')).toBeDefined();
    expect(within(insights).getByText('80%')).toBeDefined();
    expect(within(row('Resume Export')).getByText('82.4684%')).toBeDefined();
  });

  it('should reprice immediately when the target gross margin changes', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    fireEvent.change(screen.getByLabelText('Target gross margin'), {
      target: { value: '90' },
    });

    expect(figure('Minimum credit price')).toBe('$0.005704');
  });

  it('should reprice immediately when a safety buffer is added', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    fireEvent.change(screen.getByLabelText('Safety buffer'), {
      target: { value: '20' },
    });

    expect(figure('Buffered provider cost / credit')).toBe('$0.00068');
    expect(figure('Minimum credit price')).toBe('$0.0034224');
  });

  it('should reprice immediately when a provider cost is edited', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    fireEvent.change(costInput('Resume Export'), { target: { value: '0.002' } });

    expect(figure('Price-setting feature')).toBe('Resume Export');
    expect(figure('Worst-case provider cost / credit')).toBe('$0.00200');
    expect(figure('Minimum credit price')).toBe('$0.01');
  });

  it('should lower the price when the same cost is spread over more credits', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    fireEvent.change(creditsInput('Job Insights'), { target: { value: '10' } });

    expect(costInput('Job Insights')).toHaveValue('0.002852');
    expect(within(row('Job Insights')).getByText('$0.00029')).toBeDefined();
    expect(figure('Price-setting feature')).toBe('Resume Export');
    expect(figure('Minimum credit price')).toBe('$0.0025');
  });

  it('should keep a half-typed cost on screen without repricing on it', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    fireEvent.change(costInput('Resume Export'), { target: { value: '0.' } });

    expect(costInput('Resume Export')).toHaveValue('0.');
    expect(figure('Minimum credit price')).toBe('$0.002852');
  });

  it('should refuse a gross margin of 100%, which no price satisfies', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    fireEvent.change(screen.getByLabelText('Target gross margin'), {
      target: { value: '100' },
    });

    expect(figure('Minimum credit price')).toBe('$0.002852');
  });

  it('should show a feature that charges no credits as pricing nothing', () => {
    render(
      <CreditPricingCalculator
        defaultValue={[{ ...defaultValue[0]!, creditsPerExecution: 0 }]}
      />,
    );

    expect(figure('Minimum credit price')).toBe('—');
    expect(figure('Worst-case provider cost / credit')).toBe('—');
    expect(figure('Price-setting feature')).toBe('—');
  });

  it('should leave the recommended price out until a rounding is asked for', () => {
    render(<CreditPricingCalculator defaultValue={defaultValue} />);

    expect(screen.queryByText('Recommended credit price')).toBeNull();
  });

  it('should round a recommended price up to the asked-for decimal places', () => {
    render(
      <CreditPricingCalculator
        defaultOptions={{ roundUpToDecimalPlaces: 3, targetGrossMargin: 80 }}
        defaultValue={defaultValue}
      />,
    );

    expect(figure('Minimum credit price')).toBe('$0.002852');
    expect(figure('Recommended credit price')).toBe('$0.003');
  });

  it('should report a changed feature through onChange without owning the value', () => {
    const onChange = vi.fn();

    render(
      <CreditPricingCalculator
        defaultValue={defaultValue}
        value={defaultValue}
        onChange={onChange}
      />,
    );
    fireEvent.change(creditsInput('Resume Export'), { target: { value: '4' } });

    expect(onChange).toHaveBeenLastCalledWith([
      defaultValue[0],
      { ...defaultValue[1], creditsPerExecution: 4 },
    ]);
    expect(figure('Minimum credit price')).toBe('$0.002852');
  });

  it('should report changed settings through onOptionsChange', () => {
    const onOptionsChange = vi.fn();
    const options = { safetyBuffer: 0, targetGrossMargin: 80 };

    render(
      <CreditPricingCalculator
        defaultValue={defaultValue}
        options={options}
        onOptionsChange={onOptionsChange}
      />,
    );
    fireEvent.change(screen.getByLabelText('Safety buffer'), {
      target: { value: '10' },
    });

    expect(onOptionsChange).toHaveBeenLastCalledWith({
      safetyBuffer: 10,
      targetGrossMargin: 80,
    });
  });

  it('should title itself only when the host has not already named it', () => {
    const { rerender } = render(<CreditPricingCalculator defaultValue={defaultValue} />);

    expect(screen.getByRole('heading', { name: 'Credit pricing' })).toBeDefined();

    rerender(<CreditPricingCalculator defaultValue={defaultValue} title={null} />);

    expect(screen.queryByRole('heading', { name: 'Credit pricing' })).toBeNull();
    expect(screen.getByRole('region', { name: 'Credit pricing' })).toBeDefined();
  });
});

describe('pricing features derived from an allocation', () => {
  it('should price the operations a credit allocation calculated', () => {
    render(
      <CreditPricingCalculator
        defaultValue={createCreditPricingFeatures({
          operations: [
            {
              costPerExecution: { amount: '0.002852', currency: 'USD' },
              creditsPerExecution: 5,
              id: 'insights',
              label: 'Job Insights',
            },
          ],
        })}
      />,
    );

    expect(costInput('Job Insights')).toHaveValue('0.002852');
    expect(figure('Minimum credit price')).toBe('$0.002852');
  });
});

describe('formatting', () => {
  it('should show an absent rate as a dash rather than as zero', () => {
    expect(formatUnitUsd(null)).toBe('—');
    expect(formatPercent(null)).toBe('—');
  });

  it('should drop the decimal places a whole percentage does not need', () => {
    expect(formatPercent(80)).toBe('80%');
    expect(formatPercent(82.468443)).toBe('82.4684%');
  });
});
