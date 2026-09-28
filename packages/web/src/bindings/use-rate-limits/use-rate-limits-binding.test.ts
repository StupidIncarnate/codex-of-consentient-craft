import { RateLimitsSnapshotStub, RateLimitWindowStub } from '@dungeonmaster/shared/contracts';

import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';
import { useRateLimitsBinding } from './use-rate-limits-binding';
import { useRateLimitsBindingProxy } from './use-rate-limits-binding.proxy';

describe('useRateLimitsBinding', () => {
  it('VALID: {mount} => fetches and populates snapshot', async () => {
    const proxy = useRateLimitsBindingProxy();
    proxy.setupConnectedChannel();
    const snapshot = RateLimitsSnapshotStub();
    proxy.setupSnapshot({ snapshot });

    const { result } = renderHook(() => useRateLimitsBinding());

    const currentState = (): ReturnType<typeof useRateLimitsBinding> => result.current;

    await waitFor(() => {
      expect(currentState().isLoading).toBe(false);
    });

    expect(result.current).toStrictEqual({
      snapshot,
      isLoading: false,
    });
  });

  it('EMPTY: {server returns null} => snapshot stays null', async () => {
    const proxy = useRateLimitsBindingProxy();
    proxy.setupConnectedChannel();
    proxy.setupSnapshot({ snapshot: null });

    const { result } = renderHook(() => useRateLimitsBinding());

    const currentState = (): ReturnType<typeof useRateLimitsBinding> => result.current;

    await waitFor(() => {
      expect(currentState().isLoading).toBe(false);
    });

    expect(result.current).toStrictEqual({
      snapshot: null,
      isLoading: false,
    });
  });

  it('VALID: {rate-limits-updated WS} => re-fetches and updates snapshot', async () => {
    const proxy = useRateLimitsBindingProxy();
    proxy.setupConnectedChannel();
    const initial = RateLimitsSnapshotStub();
    proxy.setupSnapshot({ snapshot: initial });

    const { result } = renderHook(() => useRateLimitsBinding());

    const currentState = (): ReturnType<typeof useRateLimitsBinding> => result.current;

    await waitFor(() => {
      expect(currentState().isLoading).toBe(false);
    });

    const updated = RateLimitsSnapshotStub({
      fiveHour: RateLimitWindowStub({ usedPercentage: 81 }),
    });
    proxy.setupSnapshot({ snapshot: updated });

    act(() => {
      proxy.deliverWsMessage({
        data: JSON.stringify({
          type: 'rate-limits-updated',
          payload: {},
          timestamp: '2026-05-05T13:00:00.000Z',
        }),
      });
    });

    await waitFor(() => {
      expect(currentState().snapshot).toStrictEqual(updated);
    });

    expect(result.current).toStrictEqual({
      snapshot: updated,
      isLoading: false,
    });
  });

  it('VALID: {unrelated ws type} => does not re-fetch', async () => {
    const proxy = useRateLimitsBindingProxy();
    proxy.setupConnectedChannel();
    const initial = RateLimitsSnapshotStub();
    proxy.setupSnapshot({ snapshot: initial });

    const { result } = renderHook(() => useRateLimitsBinding());

    const currentState = (): ReturnType<typeof useRateLimitsBinding> => result.current;

    await waitFor(() => {
      expect(currentState().isLoading).toBe(false);
    });

    proxy.setupSnapshot({
      snapshot: RateLimitsSnapshotStub({ fiveHour: RateLimitWindowStub({ usedPercentage: 99 }) }),
    });

    act(() => {
      proxy.deliverWsMessage({
        data: JSON.stringify({
          type: 'quest-modified',
          payload: { questId: 'add-auth', quest: {} },
          timestamp: '2026-05-05T13:00:00.000Z',
        }),
      });
    });

    await Promise.resolve();

    expect(result.current).toStrictEqual({
      snapshot: initial,
      isLoading: false,
    });
  });
});
