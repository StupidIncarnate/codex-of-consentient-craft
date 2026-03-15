import {
  GuildIdStub,
  QuestIdStub,
  QuestStub,
  SessionIdStub,
  WorkItemStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';

import { useQuestEventsBinding } from './use-quest-events-binding';
import { useQuestEventsBindingProxy } from './use-quest-events-binding.proxy';

describe('useQuestEventsBinding', () => {
  describe('quest-modified matching', () => {
    it('VALID: {quest-modified} => sets questData and tracks questId from first response', () => {
      const proxy = useQuestEventsBindingProxy();
      const sessionId = SessionIdStub({ value: 'session-1' });
      const guildId = GuildIdStub();
      const questId = QuestIdStub({ value: 'my-quest' });
      const quest = QuestStub({
        id: questId,
        workItems: [WorkItemStub({ sessionId })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ sessionId, guildId }),
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
    it('VALID: {quest-modified for different questId after first} => does not set questData', () => {
      const proxy = useQuestEventsBindingProxy();
      const sessionId = SessionIdStub({ value: 'session-1' });
      const guildId = GuildIdStub();
      const quest = QuestStub({
        id: QuestIdStub({ value: 'my-quest' }),
        workItems: [WorkItemStub({ sessionId })],
      });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ sessionId, guildId }),
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

      expect(result.current.questData).toStrictEqual(quest);
    });
  });

  describe('quest-by-session-request on mount', () => {
    it('VALID: {sessionId and guildId provided on mount} => sends quest-by-session-request', () => {
      const proxy = useQuestEventsBindingProxy();
      const sessionId = SessionIdStub({ value: 'session-1' });
      const guildId = GuildIdStub();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ sessionId, guildId }),
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([
        {
          type: 'quest-by-session-request',
          sessionId: 'session-1',
          guildId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        },
      ]);
    });

    it('EMPTY: {sessionId is null on mount} => does not send quest-by-session-request', () => {
      const proxy = useQuestEventsBindingProxy();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ sessionId: null, guildId: null }),
      });

      const sentMessages = proxy.getSentMessages();

      expect(sentMessages).toStrictEqual([]);
    });
  });

  describe('cleanup', () => {
    it('CLEANUP: {unmount} => closes WS connection', () => {
      const proxy = useQuestEventsBindingProxy();

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ sessionId: null, guildId: null }),
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
      const sessionId = SessionIdStub({ value: 'session-1' });
      const guildId = GuildIdStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestEventsBinding({ sessionId, guildId }),
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
