import { createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAlertBadgeCount } from '../lib/alert-badge';

const state = vi.hoisted(() => ({ user: null as { id: string } | null, ready: false, read: vi.fn() }));
vi.mock('@/components/access-provider', () => ({ useAccess: () => ({ user: state.user, ready: state.ready }) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => state.read }));
vi.mock('../lib/alert-badge.functions', () => ({ getUnreadAlertCount: vi.fn() }));

function mountHook() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children);
  return { ...renderHook(() => useAlertBadgeCount(), { wrapper }), client };
}

afterEach(() => { state.user = null; state.ready = false; state.read.mockReset(); });

describe('alert badge account isolation', () => {
  it('never requests private counts without a ready signed-in account', () => {
    const hook = mountHook();
    expect(hook.result.current).toBe(0);
    state.ready = true;
    hook.rerender();
    expect(hook.result.current).toBe(0);
    expect(state.read).not.toHaveBeenCalled();
    hook.unmount();
    hook.client.clear();
  });
  it('hides the badge at sign-out and never reuses another account count', async () => {
    state.ready = true;
    state.user = { id: 'account-a' };
    state.read.mockResolvedValueOnce(3).mockResolvedValueOnce(1);
    const hook = mountHook();
    await waitFor(() => expect(hook.result.current).toBe(3));
    state.user = null;
    hook.rerender();
    expect(hook.result.current).toBe(0);
    state.user = { id: 'account-b' };
    hook.rerender();
    expect(hook.result.current).toBe(0);
    await waitFor(() => expect(hook.result.current).toBe(1));
    expect(state.read).toHaveBeenCalledTimes(2);
    hook.unmount();
    hook.client.clear();
  });
  it('removes the badge when a fresh read reports no pending notices', async () => {
    state.ready = true;
    state.user = { id: 'account-a' };
    state.read.mockResolvedValueOnce(2).mockResolvedValueOnce(0);
    const hook = mountHook();
    await waitFor(() => expect(hook.result.current).toBe(2));
    await act(async () => { await hook.client.invalidateQueries({ queryKey: ['alert-badge', 'account-a'] }); });
    await waitFor(() => expect(hook.result.current).toBe(0));
    hook.unmount();
    hook.client.clear();
  });
});