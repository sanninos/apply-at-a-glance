import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CurriculumScreen } from '../components/curriculum-screen';

const mocks = vi.hoisted(() => ({ upsert: vi.fn(), load: vi.fn(), userId: 'test-account' }));
vi.mock('@/components/access-provider', () => ({ useAccess: () => ({ ready: true, user: { id: mocks.userId, email: 'test@example.test', user_metadata: {} } }) }));
vi.mock('@/components/access-dialog', () => ({ useAccessDialog: () => ({ open: vi.fn() }) }));
vi.mock('@/components/app-bottom-nav', () => ({ AppBottomNav: () => null }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ limit: mocks.load }) }), upsert: mocks.upsert }) } }));

afterEach(() => { mocks.userId = 'test-account'; mocks.upsert.mockReset(); mocks.load.mockReset(); });

describe('curriculum section editing', () => {
  it('keeps personal and experience edits in the existing save payload', async () => {
    mocks.load.mockResolvedValue({ data: [], error: null });
    mocks.upsert.mockResolvedValue({ error: null });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><CurriculumScreen /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar datos personales' }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } });
    fireEvent.change(screen.getByLabelText('Teléfono'), { target: { value: '099123456' } });
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    const addExperience = screen.getAllByRole('button', { name: 'Añadir experiencia' }).find((button) => button.getAttribute('aria-label') === 'Añadir experiencia');
    if (!addExperience) throw new Error('Missing experience action');
    fireEvent.click(addExperience);
    fireEvent.change(screen.getByLabelText('Puesto'), { target: { value: 'Analista' } });
    fireEvent.change(screen.getByLabelText('Empresa'), { target: { value: 'Empresa de prueba' } });
    fireEvent.click(screen.getByRole('button', { name: 'Listo' }));
    fireEvent.blur(screen.getByRole('button', { name: 'Listo' }));
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'test-account', full_name: 'Ana Pérez', phone: '099123456',
      experiences: [{ puesto: 'Analista', empresa: 'Empresa de prueba', desde: '', hasta: '', descripcion: '' }],
    }), { onConflict: 'user_id' }));
    client.clear();
  });
  it('does not expose editing before a stored curriculum has loaded', async () => {
    let finish: (value: unknown) => void = () => {};
    mocks.load.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const client = new QueryClient();
    const view = render(<QueryClientProvider client={client}><CurriculumScreen /></QueryClientProvider>);
    expect(screen.queryByRole('button', { name: 'Editar datos personales' })).toBeNull();
    finish({ data: [{ full_name: 'Nombre guardado', phone: '123', summary: '', experiences: [], education: [], skills: [] }], error: null });
    fireEvent.click(await screen.findByRole('button', { name: 'Editar datos personales' }));
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Nombre guardado');
    view.unmount(); client.clear();
  });
  it('loads a fresh draft when switching accounts instead of retaining private edits', async () => {
    mocks.load.mockResolvedValue({ data: [], error: null });
    const client = new QueryClient();
    const view = render(<QueryClientProvider client={client}><CurriculumScreen /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar datos personales' }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Private account A' } });
    mocks.userId = 'account-b';
    view.rerender(<QueryClientProvider client={client}><CurriculumScreen /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar datos personales' }));
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('');
    view.unmount(); client.clear();
  });
  it('allows retrying after an unexpected network failure without losing the draft', async () => {
    mocks.load.mockResolvedValue({ data: [], error: null });
    mocks.upsert.mockRejectedValueOnce(new Error('network')).mockResolvedValue({ error: null });
    const client = new QueryClient();
    const view = render(<QueryClientProvider client={client}><CurriculumScreen /></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Editar datos personales' }));
    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Ana Pérez' } });
    fireEvent.blur(screen.getByLabelText('Nombre completo'));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Nombre completo')).toHaveValue('Ana Pérez');
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar guardado' }));
    await waitFor(() => expect(mocks.upsert).toHaveBeenCalledTimes(2));
    view.unmount(); client.clear();
  });
});