import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AccountDeletion } from '../components/account-deletion';

const mocks = vi.hoisted(() => ({ send: vi.fn(), read: vi.fn() }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('../lib/account-deletion.functions', () => ({ sendDeletionRequest: mocks.send, getDeletionRequest: mocks.read }));
vi.mock('../components/access-provider', () => ({ useAccess: () => ({ ready: true, user: { id: 'owner-1', email: 'ana@example.com' } }) }));
vi.mock('../components/access-dialog', () => ({ useAccessDialog: () => ({ open: vi.fn() }) }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('deletion form submission', () => {
  it('shows the stored receipt after sending and retains it when the form reopens', async () => {
    mocks.read.mockResolvedValue(null);
    mocks.send.mockResolvedValue({ id: 'request-1', status: 'pending', created_at: '2026-10-25T21:00:00Z' });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(<QueryClientProvider client={client}><AccountDeletion open onOpenChange={() => {}} fullName="Ana Pérez" email="ana@example.com" /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled());
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    await waitFor(() => expect(client.getQueryData(['account-deletion-request', 'owner-1'])).toEqual(expect.objectContaining({ id: 'request-1' })));
    expect(mocks.send).toHaveBeenCalledWith({ data: validInput() });
    view.rerender(<QueryClientProvider client={client}><AccountDeletion open={false} onOpenChange={() => {}} /></QueryClientProvider>);
    view.rerender(<QueryClientProvider client={client}><AccountDeletion open onOpenChange={() => {}} /></QueryClientProvider>);
    expect(await screen.findByRole('status')).toHaveTextContent('request-1');
    view.unmount(); client.clear();
  });
  it('retains entered data when sending fails and does not create a receipt', async () => {
    mocks.read.mockResolvedValue(null); mocks.send.mockRejectedValue(new Error('Network failure'));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = render(<QueryClientProvider client={client}><AccountDeletion open onOpenChange={() => {}} fullName="Ana Pérez" email="ana@example.com" /></QueryClientProvider>);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeEnabled());
    fireEvent.change(screen.getByLabelText('Motivo (opcional)'), { target: { value: 'Mi motivo' } });
    fireEvent.click(screen.getByRole('checkbox')); fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    await screen.findByRole('alert');
    expect(screen.getByLabelText('Motivo (opcional)')).toHaveValue('Mi motivo');
    expect(client.getQueryData(['account-deletion-request', 'owner-1'])).toBeNull();
    view.unmount(); client.clear();
  });
});
function validInput() { return { fullName: 'Ana Pérez', email: 'ana@example.com', reason: '', confirmed: true }; }