import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { CurriculumScreen } from '../components/curriculum-screen';

const mocks = vi.hoisted(() => ({ upsert: vi.fn().mockResolvedValue({ error: null }) }));
vi.mock('@/components/access-provider', () => ({ useAccess: () => ({ ready: true, user: { id: 'test-account', email: 'test@example.test', user_metadata: {} } }) }));
vi.mock('@/components/access-dialog', () => ({ useAccessDialog: () => ({ open: vi.fn() }) }));
vi.mock('@/components/app-bottom-nav', () => ({ AppBottomNav: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ limit: async () => ({ data: [], error: null }) }), upsert: mocks.upsert }) } }));

describe('curriculum section editing', () => {
  it('keeps personal and experience edits in the existing save payload', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><CurriculumScreen /></QueryClientProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Editar datos personales' }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '099123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Añadir experiencia' })[0]);
    fireEvent.change(screen.getByLabelText('Puesto'), { target: { value: 'Analista' } });
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'Empresa de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar curriculum' }));
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'test-account', full_name: 'Ana Pérez', phone: '099123456',
      experiences: [{ puesto: 'Analista', empresa: 'Empresa de prueba', desde: '', hasta: '', descripcion: '' }],
    }), { onConflict: 'user_id' }));
    client.clear();
  });
});