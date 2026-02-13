import {
  OrchestrationStatusStub,
  ProcessIdStub,
  QuestIdStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { AgentOutputLineStub } from '../../contracts/agent-output-line/agent-output-line.stub';
import { SlotIndexStub } from '../../contracts/slot-index/slot-index.stub';

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

      proxy.setupStartError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await expect(result.current.startExecution({ questId })).rejects.toThrow(/fetch/iu);
    });
  });

  describe('malformed API responses', () => {
    it('ERROR: {processStatusBroker returns malformed status} => does not crash', async () => {
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

      expect(result.current).toStrictEqual({
        processStatus: status,
        isRunning: true,
        error: null,
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });

    it('ERROR: {questStartBroker returns undefined processId} => throws ZodError', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });

      proxy.setupInvalidStartResponse();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await expect(result.current.startExecution({ questId })).rejects.toThrow(/invalid_type/u);
    });
  });

  describe('WebSocket message handling', () => {
    it('VALID: {ws message type "agent-output" with valid lines} => appends lines to slotOutputs', async () => {
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

      const slotIndex = SlotIndexStub({ value: 0 });
      const line = AgentOutputLineStub({ value: 'Building auth guard...' });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'agent-output',
              payload: { slotIndex: 0, lines: ['Building auth guard...'] },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.slotOutputs).toStrictEqual(new Map([[slotIndex, [line]]]));
    });

    it('EDGE: {ws message fails safeParse} => silently ignores message', async () => {
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

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({ invalid: 'not-a-valid-message' }),
          });
        },
      });

      expect(result.current.slotOutputs).toStrictEqual(new Map());
    });

    it('EDGE: {ws message has invalid slotIndex} => does not update slotOutputs', async () => {
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

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'agent-output',
              payload: { slotIndex: -1, lines: ['some line'] },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.slotOutputs).toStrictEqual(new Map());
    });

    it('EDGE: {ws message has empty lines array} => does not update slotOutputs', async () => {
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

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'agent-output',
              payload: { slotIndex: 0, lines: [] },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.slotOutputs).toStrictEqual(new Map());
    });

    it('EDGE: {ws message payload.lines is not an array} => treats as empty', async () => {
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

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'agent-output',
              payload: { slotIndex: 0, lines: 'not-an-array' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.slotOutputs).toStrictEqual(new Map());
    });

    it('EDGE: {ws message has mix of valid and invalid lines} => only appends valid lines', async () => {
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

      const validLine = AgentOutputLineStub({ value: 'valid line' });
      const slotIndex = SlotIndexStub({ value: 0 });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'agent-output',
              payload: { slotIndex: 0, lines: ['valid line', 123, null, 'valid line'] },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.slotOutputs).toStrictEqual(
        new Map([[slotIndex, [validLine, validLine]]]),
      );
    });
  });

  describe('status polling errors and terminal phases', () => {
    it('ERROR: {status poll fails} => sets error state and preserves isRunning', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });

      proxy.setupStart({ processId });
      proxy.setupStatusError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current).toStrictEqual({
        processStatus: null,
        isRunning: true,
        error: expect.any(Error),
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });

    it('ERROR: {status poll throws non-Error} => wraps in Error', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });

      proxy.setupStart({ processId });
      proxy.setupStatusError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current).toStrictEqual({
        processStatus: null,
        isRunning: true,
        error: expect.any(Error),
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });

    it('VALID: {phase: "failed"} => stops polling and sets isRunning to false', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });
      const status = OrchestrationStatusStub({
        processId: 'proc-99999',
        questId: 'add-auth',
        phase: 'failed',
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

      expect(result.current).toStrictEqual({
        processStatus: status,
        isRunning: false,
        error: null,
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });

    it('VALID: {phase: "pathseeker"} => keeps polling, isRunning stays true', async () => {
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

      expect(result.current).toStrictEqual({
        processStatus: status,
        isRunning: true,
        error: null,
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });
  });

  describe('cleanup and edge cases', () => {
    it('VALID: {component unmounts during execution} => clears interval and closes WebSocket', async () => {
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

      const { result, unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current.isRunning).toBe(true);

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(result.current.isRunning).toBe(true);
    });

    it('VALID: {stopPolling called during active execution} => clears interval, closes ws, sets isRunning false', async () => {
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

      testingLibraryActAdapter({
        callback: () => {
          result.current.stopPolling();
        },
      });

      expect(result.current.isRunning).toBe(false);
    });

    it('EDGE: {startExecution called twice} => cleans up first execution before starting second', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });
      const secondProcessId = ProcessIdStub({ value: 'proc-88888' });
      const status = OrchestrationStatusStub({
        processId: 'proc-99999',
        questId: 'add-auth',
        phase: 'pathseeker',
      });
      const secondStatus = OrchestrationStatusStub({
        processId: 'proc-88888',
        questId: 'add-auth',
        phase: 'codeweaver',
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

      proxy.setupStart({ processId: secondProcessId });
      proxy.setupStatus({ status: secondStatus });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current).toStrictEqual({
        processStatus: secondStatus,
        isRunning: true,
        error: null,
        startExecution: expect.any(Function),
        stopPolling: expect.any(Function),
        slotOutputs: new Map(),
      });
    });

    it('ERROR: {broker throws non-Error value} => wraps in Error via String()', async () => {
      const proxy = useExecutionBindingProxy();
      const questId = QuestIdStub({ value: 'add-auth' });
      const processId = ProcessIdStub({ value: 'proc-99999' });

      proxy.setupStart({ processId });
      proxy.setupStatusError();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useExecutionBinding(),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          await result.current.startExecution({ questId });
        },
      });

      expect(result.current.error).toStrictEqual(expect.any(Error));
    });
  });
});
