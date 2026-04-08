import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DayStatus } from '../DayStatus';

describe('DayStatus', () => {
  it('renders a multi-person scoreboard with status chips', () => {
    render(
      <DayStatus
        rows={[
          {
            name: 'Ricardo',
            color: 'blue',
            targetKcal: 2200,
            remainingKcal: 680,
            totalPlanned: 1520,
            totalProtein: 131,
            onRemainingChange: vi.fn(),
          },
          {
            name: 'Ana',
            color: 'rose',
            targetKcal: 1700,
            remainingKcal: 450,
            totalPlanned: 1250,
            totalProtein: 108,
            onRemainingChange: vi.fn(),
          },
        ]}
        onRecalc={vi.fn()}
      />,
    );

    expect(screen.getByText(/scoreboard diario/i)).toBeInTheDocument();
    expect(screen.getAllByText(/estado/i).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThanOrEqual(2);
  });
});
