import type { CostBatch, ModelPricing } from '@pixpilot/cost-calculator';

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NumberSlider } from '../src/components/NumberSlider.tsx';
import { CostCalculator } from '../src/index.ts';

const model: ModelPricing = {
  inputPricePerMillionTokens: 0.15,
  outputPricePerMillionTokens: 0.6,
};

const initialValue: CostBatch[] = [
  {
    name: 'Analysis',
    paths: [{ costPerExecution: 0.003, name: 'PDF', type: 'fixed' }],
    quantity: 200,
  },
];

describe('cost calculator', () => {
  it('should render core-calculated path, batch, and grand totals', () => {
    render(<CostCalculator defaultValue={initialValue} model={model} />);

    expect(screen.getAllByText('$0.003')).toHaveLength(2);
    expect(screen.getAllByText('$0.60')).toHaveLength(3);
  });

  it('should update the input model when a fixed path changes', () => {
    const onChange = vi.fn();

    render(
      <CostCalculator defaultValue={initialValue} model={model} onChange={onChange} />,
    );
    fireEvent.change(screen.getByLabelText('Cost / execution'), {
      target: { value: '0.01' },
    });

    expect(onChange).toHaveBeenLastCalledWith([
      {
        ...initialValue[0],
        paths: [{ costPerExecution: 0.01, name: 'PDF', type: 'fixed' }],
      },
    ]);
    expect(screen.getAllByText('$2.00')).toHaveLength(3);
  });

  it('should add batches without introducing UI-only state', () => {
    const onChange = vi.fn();

    render(
      <CostCalculator defaultValue={initialValue} model={model} onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add batch' }));

    expect(screen.getByDisplayValue('new-batch')).not.toBeNull();
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should price every token path at the supplied model', () => {
    const value: CostBatch[] = [
      {
        name: 'Analysis',
        paths: [
          {
            inputTokens: 1_000,
            name: 'AI operation',
            outputTokens: 500,
            type: 'tokens',
          },
        ],
        quantity: 1,
      },
    ];

    render(<CostCalculator compact defaultValue={value} model={model} />);

    expect(screen.getAllByText('$0.00045')).toHaveLength(2);
  });

  it('should show every feature total before the grand total in compact mode', () => {
    render(<CostCalculator compact defaultValue={initialValue} model={model} />);

    expect(
      screen.getByLabelText('Quantity for Analysis', { selector: 'input' }),
    ).toBeDefined();
    expect(screen.getByText('Grand total')).toBeDefined();
  });

  it('should update a feature quantity from the compact summary slider', () => {
    const onChange = vi.fn();

    render(
      <CostCalculator
        compact
        defaultValue={initialValue}
        model={model}
        onChange={onChange}
      />,
    );
    fireEvent.change(
      screen.getByLabelText('Quantity for Analysis', { selector: 'input' }),
      { target: { value: '250' } },
    );

    expect(onChange).toHaveBeenLastCalledWith([{ ...initialValue[0], quantity: 250 }]);
  });

  it('should reveal the feature estimate cards only after the toggle is clicked', () => {
    render(<CostCalculator compact defaultValue={initialValue} model={model} />);

    expect(screen.queryByText('Feature estimates')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Show feature estimates' }));
    expect(screen.getByText('Feature estimates')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Hide feature estimates' }));
    expect(screen.queryByText('Feature estimates')).toBeNull();
  });

  it('should edit a feature from the settings popover on its summary row', () => {
    const onChange = vi.fn();

    render(
      <CostCalculator
        compact
        defaultValue={initialValue}
        model={model}
        onChange={onChange}
      />,
    );

    expect(screen.queryByLabelText('PDF cost')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Settings for Analysis' }));
    fireEvent.keyDown(screen.getByLabelText('PDF cost'), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenLastCalledWith([
      {
        ...initialValue[0],
        paths: [{ costPerExecution: 0.004, name: 'PDF', type: 'fixed' }],
      },
    ]);
  });

  it('should update values with the shared shadcn slider', () => {
    const onChange = vi.fn();

    render(
      <NumberSlider
        label="Quantity"
        max={1_000}
        min={1}
        step={1}
        value={200}
        valueLabel="200"
        onChange={onChange}
      />,
    );

    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' });

    expect(onChange).toHaveBeenLastCalledWith(201);
  });
});
