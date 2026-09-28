import { renderHook, waitFor } from '#gateway/npm/testing-library__react';
import { useOrchestrationModeBinding } from './use-orchestration-mode-binding';
import { useOrchestrationModeBindingProxy } from './use-orchestration-mode-binding.proxy';

describe('useOrchestrationModeBinding', () => {
  describe('initial mount', () => {
    it('VALID: {mount, mode: node} => fetches and populates mode', async () => {
      const proxy = useOrchestrationModeBindingProxy();
      proxy.setupMode({ mode: 'node' });

      const { result } = renderHook(() => useOrchestrationModeBinding());

      const current = (): ReturnType<typeof useOrchestrationModeBinding> => result.current;

      await waitFor(() => {
        expect(current().isLoading).toBe(false);
      });

      expect(result.current).toStrictEqual({ mode: 'node', isLoading: false });
    });

    it('VALID: {initial mount} => isLoading starts true with null mode', () => {
      const proxy = useOrchestrationModeBindingProxy();
      proxy.setupMode({ mode: 'claude' });

      const { result } = renderHook(() => useOrchestrationModeBinding());

      expect(result.current).toStrictEqual({ mode: null, isLoading: true });
    });

    it('ERROR: {fetch fails} => mode stays null and isLoading resolves false', async () => {
      const proxy = useOrchestrationModeBindingProxy();
      proxy.setupError();

      const { result } = renderHook(() => useOrchestrationModeBinding());

      const current = (): ReturnType<typeof useOrchestrationModeBinding> => result.current;

      await waitFor(() => {
        expect(current().isLoading).toBe(false);
      });

      expect(result.current).toStrictEqual({ mode: null, isLoading: false });
    });
  });
});
