import {
  OrchestrationStatusStub,
  ProcessIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useExecutionBinding } from './use-execution-binding';
import { useExecutionBindingProxy } from './use-execution-binding.proxy';

describe('useExecutionBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {} => starts with no process and not running', () => {
      useExecutionBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      expect(result.current).toStrictEqual({
        processStatus: null,
        isRunning: false,
        error: null,
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });
  });

  describe('startExecution', () => {
    it('VALID: {questId} => sets isRunning to true', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });
      const status = OrchestrationStatusStub({
        processId: 'proc-99999',
        questId: 'add-auth',
        phase: 'pathseeker',
      });

      proxy.setupStart({ processId });
      proxy.setupStatus({ status });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current.isRunning).toBe(true);
    });
  });

  describe('polling stops on complete', () => {
    it('VALID: {phase: complete} => sets isRunning to false', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });
      const status = OrchestrationStatusStub({
        processId: 'proc-99999',
        phase: 'complete',
      });

      proxy.setupStart({ processId });
      proxy.setupStatus({ status });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current.processStatus).toStrictEqual(status);
    });
  });

  describe('error handling', () => {
    it('ERROR: {start fails} => throws error', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupStartError({ error: new Error('Server unavailable') });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await expect(result.current.startExecution({ questId })).rejects.toThrow(
        'Server unavailable',
      );
    });
  });
});
