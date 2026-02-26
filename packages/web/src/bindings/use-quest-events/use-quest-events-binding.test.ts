import { ProcessIdStub, QuestIdStub, QuestStub } from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useQuestEventsBinding } from './use-quest-events-binding';
import { useQuestEventsBindingProxy } from './use-quest-events-binding.proxy';

describe('useQuestEventsBinding', () => {
  describe('quest-modified matching', () => {
    it('VALID: {quest-modified for matching questId} => sets questData', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });
      const quest = QuestStub({ id: questId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId, chatProcessId: null }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'my-quest', quest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.questData).toStrictEqual(quest);
    });
  });

  describe('quest-modified non-matching', () => {
    it('VALID: {quest-modified for different questId} => does not set questData', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId, chatProcessId: null }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: {
                questId: 'other-quest',
                quest: QuestStub({ id: QuestIdStub({ value: 'other-quest' }) }),
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.questData).toBeNull();
    });
  });

  describe('quest-data-request on mount', () => {
    it('VALID: {questId provided on mount} => sends quest-data-request', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId, chatProcessId: null }),
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([{ type: 'quest-data-request', questId: 'my-quest' }]);
    });

    it('EMPTY: {questId is null on mount} => does not send quest-data-request', () => {
      const proxy = useQuestEventsBindingProxy();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId: null, chatProcessId: null }),
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([]);
    });
  });

  describe('quest-session-linked', () => {
    it('VALID: {quest-session-linked with matching chatProcessId} => stores questId and sends quest-data-request', () => {
      const proxy = useQuestEventsBindingProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-1' });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId: null, chatProcessId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-session-linked',
              payload: { chatProcessId: 'proc-1', questId: 'linked-quest' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([{ type: 'quest-data-request', questId: 'linked-quest' }]);
    });

    it('VALID: {quest-session-linked then quest-modified} => sets questData for linked questId', () => {
      const proxy = useQuestEventsBindingProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-1' });
      const quest = QuestStub({ id: QuestIdStub({ value: 'linked-quest' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId: null, chatProcessId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-session-linked',
              payload: { chatProcessId: 'proc-1', questId: 'linked-quest' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'linked-quest', quest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.questData).toStrictEqual(quest);
    });

    it('EDGE: {quest-session-linked with non-matching chatProcessId} => ignores message', () => {
      const proxy = useQuestEventsBindingProxy();
      const chatProcessId = ProcessIdStub({ value: 'proc-1' });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId: null, chatProcessId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-session-linked',
              payload: { chatProcessId: 'different-proc', questId: 'linked-quest' },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([]);
    });
  });

  describe('cleanup', () => {
    it('CLEANUP: {unmount} => closes WS connection', () => {
      const proxy = useQuestEventsBindingProxy();

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId: null, chatProcessId: null }),
      });

      const closeMock = proxy.getSocketClose();

      expect(closeMock).toHaveBeenCalledTimes(0);

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('invalid messages', () => {
    it('EDGE: {invalid WS message} => does not set questData', () => {
      const proxy = useQuestEventsBindingProxy();
      const questId = QuestIdStub({ value: 'my-quest' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ questId, chatProcessId: null }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({ invalid: 'not-valid' }),
          });
        },
      });

      expect(result.current.questData).toBeNull();
    });
  });
});
