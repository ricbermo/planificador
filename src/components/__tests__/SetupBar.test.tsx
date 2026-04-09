import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SetupBar } from '../SetupBar';
import { defaultMetrics } from '../../lib/nutrition';

function setup(override?: Partial<ComponentProps<typeof SetupBar>>) {
  const props: ComponentProps<typeof SetupBar> = {
    targetKcal: 2200,
    dayMeat: 'chicken',
    person1Name: 'Ricardo',
    person1Metrics: defaultMetrics(),
    person1ManualOverride: false,
    p2Enabled: false,
    p2Name: 'Ana',
    p2TargetKcal: 1700,
    p2Metrics: defaultMetrics(),
    p2ManualOverride: false,
    onTargetChange: vi.fn(),
    onMeatChange: vi.fn(),
    onPerson1NameChange: vi.fn(),
    onPerson1MetricsChange: vi.fn(),
    onPerson1ResetAuto: vi.fn(),
    onTogglePerson2: vi.fn(),
    onP2NameChange: vi.fn(),
    onP2TargetChange: vi.fn(),
    onP2MetricsChange: vi.fn(),
    onP2ResetAuto: vi.fn(),
    onGenerate: vi.fn(),
    ...override,
  };

  render(<SetupBar {...props} />);
  return props;
}

describe('SetupBar', () => {
  it('renders grouped people configuration layout', () => {
    setup();
    expect(screen.getByText(/configuración del día/i)).toBeInTheDocument();
    expect(screen.getByText(/persona 1/i)).toBeInTheDocument();
  });

  it('triggers add second person action', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('button', { name: /^agregar$/i }));
    expect(props.onTogglePerson2).toHaveBeenCalledTimes(1);
  });

  it('renders body metric inputs for persona 1', () => {
    setup();
    expect(screen.getByLabelText(/edad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estatura/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^peso \(kg\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/peso meta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^% grasa$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/% grasa meta/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/semanas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nivel de actividad/i)).toBeInTheDocument();
  });

  it('emits metric patch when current weight changes', () => {
    const props = setup();
    const input = screen.getByLabelText(/^peso \(kg\)/i);
    fireEvent.change(input, { target: { value: '82' } });
    expect(props.onPerson1MetricsChange).toHaveBeenCalledWith({ currentWeightKg: 82 });
  });

  it('shows Auto button only when manual override is active', async () => {
    const props = setup({ person1ManualOverride: true });
    const autoBtn = screen.getByRole('button', { name: /auto/i });
    expect(autoBtn).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(autoBtn);
    expect(props.onPerson1ResetAuto).toHaveBeenCalledTimes(1);
  });

  it('suggests target weight, body fat and weeks together', async () => {
    const user = userEvent.setup();
    const props = setup();

    await user.click(screen.getByRole('button', { name: /sugerir/i }));

    expect(props.onPerson1MetricsChange).toHaveBeenCalledWith(
      expect.objectContaining({
        targetWeightKg: expect.any(Number),
        targetBodyFatPct: expect.any(Number),
        weeksToGoal: expect.any(Number),
      }),
    );
  });
});
