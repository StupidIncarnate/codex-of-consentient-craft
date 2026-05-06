import { QuestQueueEntryStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';
import { useQuestQueueBinding } from './use-quest-queue-binding';
import { useQuestQueueBindingProxy } from './use-quest-queue-binding.proxy';

describe('useQuestQueueBinding', () => {
  describe('initial mount', () => {
    it('VALID: {mount} => fetches and populates entries', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      const entries = [
        QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' }),
        QuestQueueEntryStub({ questId: 'q-2', questTitle: 'Second' }),
      ];
      proxy.setupEntries({ entries });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        activeEntry: entries[0],
        allEntries: entries,
        errorEntry: undefined,
        isLoading: false,
      });
    });

    it('EMPTY: {queue empty} => returns no active entry', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupEntries({ entries: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        activeEntry: null,
        allEntries: [],
        errorEntry: undefined,
        isLoading: false,
      });
    });

    it('VALID: {initial mount} => isLoading starts true', () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      proxy.setupEntries({ entries: [] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('error entry derivation', () => {
    it('VALID: {head has error} => errorEntry equals head', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      const headWithError = QuestQueueEntryStub({
        questId: 'q-err',
        questTitle: 'Errored',
        error: {
          message: 'runner threw' as never,
          at: '2024-01-15T10:06:00.000Z' as never,
        },
      });
      const second = QuestQueueEntryStub({ questId: 'q-ok', questTitle: 'Next' });
      proxy.setupEntries({ entries: [headWithError, second] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        activeEntry: headWithError,
        allEntries: [headWithError, second],
        errorEntry: headWithError,
        isLoading: false,
      });
    });

    it('VALID: {only non-head has error} => errorEntry is undefined', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      const head = QuestQueueEntryStub({ questId: 'q-ok', questTitle: 'Head' });
      const tailErr = QuestQueueEntryStub({
        questId: 'q-err',
        questTitle: 'Tail',
        error: {
          message: 'runner threw' as never,
          at: '2024-01-15T10:06:00.000Z' as never,
        },
      });
      proxy.setupEntries({ entries: [head, tailErr] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      expect(result.current).toStrictEqual({
        activeEntry: head,
        allEntries: [head, tailErr],
        errorEntry: undefined,
        isLoading: false,
      });
    });
  });

  describe('websocket refetch', () => {
    it('VALID: {execution-queue-updated} => re-fetches and updates entries', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      const initial = [QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' })];
      proxy.setupEntries({ entries: initial });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      const updated = [
        QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' }),
        QuestQueueEntryStub({ questId: 'q-2', questTitle: 'Second' }),
      ];
      proxy.setupEntries({ entries: updated });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'execution-queue-updated',
              payload: {},
              timestamp: '2024-01-15T10:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().allEntries).toStrictEqual(updated);
        },
      });

      expect(result.current).toStrictEqual({
        activeEntry: updated[0],
        allEntries: updated,
        errorEntry: undefined,
        isLoading: false,
      });
    });

    it('VALID: {execution-queue-error} => re-fetches and surfaces errorEntry', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      const initial = [QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' })];
      proxy.setupEntries({ entries: initial });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      const failed = QuestQueueEntryStub({
        questId: 'q-1',
        questTitle: 'First',
        error: {
          message: 'runner threw' as never,
          at: '2024-01-15T10:06:00.000Z' as never,
        },
      });
      proxy.setupEntries({ entries: [failed] });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'execution-queue-error',
              payload: {},
              timestamp: '2024-01-15T10:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().errorEntry).toStrictEqual(failed);
        },
      });

      expect(result.current).toStrictEqual({
        activeEntry: failed,
        allEntries: [failed],
        errorEntry: failed,
        isLoading: false,
      });
    });

    it('VALID: {unrelated ws type} => does not re-fetch', async () => {
      const proxy = useQuestQueueBindingProxy();
      proxy.setupConnectedChannel();
      const initial = [QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' })];
      proxy.setupEntries({ entries: initial });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestQueueBinding(),
      });

      const currentState = (): ReturnType<typeof useQuestQueueBinding> => result.current;

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(currentState().isLoading).toBe(false);
        },
      });

      const other = [
        QuestQueueEntryStub({ questId: 'q-1', questTitle: 'First' }),
        QuestQueueEntryStub({ questId: 'q-2', questTitle: 'Second' }),
      ];
      proxy.setupEntries({ entries: other });

      testingLibraryActAdapter({
        callback: () => {
          proxy.deliverWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'add-auth', quest: {} },
              timestamp: '2024-01-15T10:00:00.000Z',
            }),
          });
        },
      });

      // Allow any microtasks to settle.
      await Promise.resolve();

      expect(result.current).toStrictEqual({
        activeEntry: initial[0],
        allEntries: initial,
        errorEntry: undefined,
        isLoading: false,
      });
    });
  });
});
