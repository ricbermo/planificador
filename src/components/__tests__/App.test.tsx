import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../../App';

describe('App shell', () => {
  it('renders professional planning header copy', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /planificador de comidas/i })).toBeInTheDocument();
    expect(screen.getByText(/planifica y compara el día en segundos/i)).toBeInTheDocument();
  });
});
