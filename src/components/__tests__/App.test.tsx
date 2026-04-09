import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../../App';

describe('App shell', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders professional planning header copy', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /planificador de comidas/i })).toBeInTheDocument();
    expect(screen.getByText(/planifica y compara el día en segundos/i)).toBeInTheDocument();
  });

  it('auto-recomputes person 2 target when metrics change and override is off', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^agregar$/i }));

    const p2Target = screen.getByLabelText('Kcal objetivo', {
      selector: '#person2-target-kcal',
    }) as HTMLInputElement;
    const p2Weight = screen.getByLabelText(/^peso \(kg\)/i, {
      selector: '#person2-current-weight',
    }) as HTMLInputElement;

    const before = Number(p2Target.value);
    await user.clear(p2Weight);
    await user.type(p2Weight, '70');

    const after = Number(p2Target.value);
    expect(after).not.toBe(before);
  });

  it('resumes auto target for person 2 after changing metrics', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^agregar$/i }));

    const p2Target = screen.getByLabelText('Kcal objetivo', {
      selector: '#person2-target-kcal',
    }) as HTMLInputElement;
    const p2Weight = screen.getByLabelText(/^peso \(kg\)/i, {
      selector: '#person2-current-weight',
    }) as HTMLInputElement;

    await user.clear(p2Target);
    await user.type(p2Target, '1800');
    expect(Number(p2Target.value)).toBe(1800);

    await user.clear(p2Weight);
    await user.type(p2Weight, '70');

    expect(Number(p2Target.value)).not.toBe(1800);
  });
});
