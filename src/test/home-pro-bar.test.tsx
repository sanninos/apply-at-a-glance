import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeProBar } from '../components/home-pro-bar';

describe('PRO bar interaction', () => {
  it('opens the Premium plans screen when the bar is tapped', () => {
    render(<HomeProBar />);
    expect(screen.queryByRole('dialog', { name: 'Planes UruJobs Premium' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Adquiere PRO y obtén ventajas exclusivas' }));
    const dialog = screen.getByRole('dialog', { name: 'Planes UruJobs Premium' });
    expect(dialog).toHaveTextContent('Pasate a UruJobs Premium');
    expect(dialog).toHaveTextContent('solo se pueden contratar desde la app de Android');
  });

  it('closes the plans screen with its own close button and leaves the bar in place', () => {
    render(<HomeProBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Adquiere PRO y obtén ventajas exclusivas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog', { name: 'Planes UruJobs Premium' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Adquiere PRO y obtén ventajas exclusivas' })).toBeTruthy();
  });

  it('keeps the X closing the bar without opening the plans screen', () => {
    render(<HomeProBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar aviso de PRO' }));
    expect(screen.queryByRole('dialog', { name: 'Planes UruJobs Premium' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Adquiere PRO y obtén ventajas exclusivas' })).toBeNull();
  });
});
