import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Paywall } from '../components/paywall';
import type { PaywallPlan } from '../lib/revenuecat';

const monthly: PaywallPlan = { id: 'monthly', nombre: 'Mensual', precio: '$ 199', periodo: '/mes', nota: 'Cancelás cuando quieras', cobro: '$ 199 por mes', pruebaDias: 7 };
const yearly: PaywallPlan = { id: 'yearly', nombre: 'Anual', precio: '$ 1.490', periodo: '/año', nota: 'Equivale a $ 124 por mes', cobro: '$ 1.490 por año', etiqueta: 'Ahorrás 38%', pruebaDias: 7 };
const lifetime: PaywallPlan = { id: 'lifetime', nombre: 'De por vida', precio: '$ 3.000', periodo: '', nota: 'Pago único', cobro: '$ 3.000 en un solo pago', pruebaDias: null };

describe('Paywall', () => {
  it('shows the store prices and the free trial, and starts the selected plan', () => {
    const onStart = vi.fn();
    render(<Paywall plans={[monthly, yearly]} onStart={onStart} />);
    expect(screen.getByText('Probá UruJobs Premium 7 días gratis')).toBeTruthy();
    expect(screen.getByText('7 días gratis, después $ 1.490 por año. Renovación automática.')).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: /Mensual/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Empezar mis 7 días gratis' }));
    expect(onStart).toHaveBeenCalledWith(monthly);
  });

  it('does not promise a trial for a plan without one', () => {
    render(<Paywall plans={[monthly, lifetime]} />);
    fireEvent.click(screen.getByRole('radio', { name: /De por vida/ }));
    expect(screen.queryByText(/gratis/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Suscribirme por $ 3.000' })).toBeTruthy();
    expect(screen.queryByText(/Renovación automática/)).toBeNull();
  });

  it('offers no purchase while plans are unavailable', () => {
    render(<Paywall state="loading" />);
    expect(screen.getByText('Cargando planes…')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /gratis|Suscribirme/ })).toBeNull();
  });
});
