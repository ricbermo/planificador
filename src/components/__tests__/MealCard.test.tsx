import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MealCard } from '../MealCard';
import type { Meal } from '../../lib/types';

const baseMeal: Meal = {
  slot: 'lunch',
  done: false,
  useDayMeat: true,
  items: [
    {
      foodId: 'egg',
      multiplier: 2,
      multiplierP2: 1.4,
    },
  ],
};

describe('MealCard', () => {
  it('shows a clear comparison area when second person is enabled', () => {
    render(
      <MealCard
        meal={baseMeal}
        budget={900}
        budgetP2={700}
        person1Name="Ricardo"
        person2Name="Ana"
        canToggleDayMeat
        onToggleDone={vi.fn()}
        onToggleDayMeat={vi.fn()}
        onRerollItem={vi.fn()}
        onRerollMeal={vi.fn()}
      />,
    );

    expect(screen.getByText(/comparativa por persona/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ricardo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ana/i).length).toBeGreaterThan(0);

    expect(screen.getByRole('heading', { name: 'Almuerzo' })).toBeInTheDocument();

    const foodTitle = screen.getByText(/huevo entero/i);
    const itemTopRow = foodTitle.parentElement;
    expect(itemTopRow).toHaveClass('items-center');

    const lineContainer = screen.getByText(/ricardo:/i).closest('div');
    expect(lineContainer).toHaveClass('w-full');
  });
});
