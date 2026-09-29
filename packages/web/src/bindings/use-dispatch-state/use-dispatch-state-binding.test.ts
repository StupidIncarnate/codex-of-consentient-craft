import { DispatchStateStub } from '@dungeonmaster/shared/contracts/dispatch-state/dispatch-state.stub';

import { act, renderHook, waitFor } from '#gateway/npm/testing-library__react';
import { useDispatchStateBinding } from './use-dispatch-state-binding';
import { useDispatchStateBindingProxy } from './use-dispatch-state-binding.proxy';

describe('useDispatchStateBinding', () => {
  describe('initial mount', () => {
    it('VALID: {mount} => fetches and populates state', async () => {
      const proxy = useDispatchStateBindingProxy();
      proxy.setupConnectedChannel();
      const state = DispatchStateStub({ mode: 'paused' });
      proxy.setupState({ state });

      const { result } = renderHook(() => useDispatchStateBinding());

      const currentState = (): ReturnType<typeof useDispatchStateBinding> => result.current;

      await waitFor(() => {
        expect(currentState().isLoading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        state,
        isLoading: false,
      });
    });

    it('VALID: {initial mount} => isLoading starts true with null state', () => {
      const proxy = useDispatchStateBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupState({ state: DispatchStateStub() });

      const { result } = renderHook(() => useDispatchStateBinding());

      expect(result.current).toStrictEqual({
        state: null,
        isLoading: true,
      });
    });

    it('ERROR: {fetch fails} => state stays null and isLoading resolves false', async () => {
      const proxy = useDispatchStateBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupError();

      const { result } = renderHook(() => useDispatchStateBinding());

      const currentState = (): ReturnType<typeof useDispatchStateBinding> => result.current;

      await waitFor(() => {
        expect(currentState().isLoading).toBe(false);
      });

      expect(result.current).toStrictEqual({
        state: null,
        isLoading: false,
      });
    });
  });

  describe('websocket refetch', () => {
    it('VALID: {dispatch-state-changed} => re-fetches and updates state', async () => {
      const proxy = useDispatchStateBindingProxy();
      proxy.setupConnectedChannel();
      const initial = DispatchStateStub({ mode: 'paused' });
      proxy.setupState({ state: initial });

      const { result } = renderHook(() => useDispatchStateBinding());

      const currentState = (): ReturnType<typeof useDispatchStateBinding> => result.current;

      await waitFor(() => {
        expect(currentState().isLoading).toBe(false);
      });

      const updated = DispatchStateStub({
        mode: 'node-playing',
        updatedAt: '2024-01-15T10:10:00.000Z' as never,
      });
      proxy.setupState({ state: updated });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'dispatch-state-changed',
            payload: {},
            timestamp: '2024-01-15T10:10:00.000Z',
          }),
        });
      });

      await waitFor(() => {
        expect(currentState().state).toStrictEqual(updated);
      });

      expect(result.current).toStrictEqual({
        state: updated,
        isLoading: false,
      });
    });

    it('VALID: {unrelated ws type} => does not re-fetch', async () => {
      const proxy = useDispatchStateBindingProxy();
      proxy.setupConnectedChannel();
      const initial = DispatchStateStub({ mode: 'paused' });
      proxy.setupState({ state: initial });

      const { result } = renderHook(() => useDispatchStateBinding());

      const currentState = (): ReturnType<typeof useDispatchStateBinding> => result.current;

      await waitFor(() => {
        expect(currentState().isLoading).toBe(false);
      });

      const other = DispatchStateStub({
        mode: 'node-playing',
        updatedAt: '2024-01-15T10:10:00.000Z' as never,
      });
      proxy.setupState({ state: other });

      act(() => {
        proxy.deliverWsMessage({
          data: JSON.stringify({
            type: 'execution-queue-updated',
            payload: {},
            timestamp: '2024-01-15T10:10:00.000Z',
          }),
        });
      });

      // Allow any microtasks to settle.
      await Promise.resolve();

      expect(result.current).toStrictEqual({
        state: initial,
        isLoading: false,
      });
    });
  });
});
