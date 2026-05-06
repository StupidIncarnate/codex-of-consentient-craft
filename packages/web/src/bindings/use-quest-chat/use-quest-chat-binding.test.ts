import {
  AskUserQuestionStub,
  ProcessIdStub,
  QuestIdStub,
  QuestStub,
  QuestWorkItemIdStub,
  SessionIdStub,
  UserInputStub,
} from '@dungeonmaster/shared/contracts';

import { testingLibraryActAdapter } from '../../adapters/testing-library/act/testing-library-act-adapter';
import { testingLibraryActAsyncAdapter } from '../../adapters/testing-library/act-async/testing-library-act-async-adapter';
import { testingLibraryRenderHookAdapter } from '../../adapters/testing-library/render-hook/testing-library-render-hook-adapter';
import { testingLibraryWaitForAdapter } from '../../adapters/testing-library/wait-for/testing-library-wait-for-adapter';

import { useQuestChatBinding } from './use-quest-chat-binding';
import { useQuestChatBindingProxy } from './use-quest-chat-binding.proxy';

describe('useQuestChatBinding', () => {
  describe('initial state', () => {
    it('EMPTY: {questId: null} => starts with empty entries map and not streaming', () => {
      useQuestChatBindingProxy();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: null }),
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        slotEntries: new Map(),
        quest: null,
        pendingClarification: null,
        isStreaming: false,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('subscribe-quest on mount', () => {
    it('VALID: {questId provided on mount} => sends subscribe-quest over WS', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-sub-1' });

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      const sentMessages = proxy.getSentWsMessages();

      expect(sentMessages).toStrictEqual([{ type: 'subscribe-quest', questId: 'quest-sub-1' }]);
    });

    it('EMPTY: {questId: null} => does not send subscribe-quest', () => {
      const proxy = useQuestChatBindingProxy();

      testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: null }),
      });

      const sentMessages = proxy.getSentWsMessages();

      expect(sentMessages).toStrictEqual([]);
    });
  });

  describe('chat-output handling', () => {
    it('VALID: {chat-output with sessionId} => buckets entries under that session and sets isStreaming', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-out-1' });
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entryUuid = '00000000-0000-4000-8000-000000000001';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-out-1',
                workItemId: QuestWorkItemIdStub(),
                sessionId,
                chatProcessId: ProcessIdStub({ value: 'proc-1' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'hello',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const expectedMap = new Map();
      expectedMap.set(sessionId, [
        {
          role: 'assistant',
          type: 'text',
          content: 'hello',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);

      expect(result.current).toStrictEqual({
        entriesBySession: expectedMap,
        slotEntries: new Map(),
        quest: null,
        pendingClarification: null,
        isStreaming: true,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {chat-output for different questId} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-mine' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-other',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-2' }),
                entries: [{ role: 'assistant', type: 'text', content: 'noise' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        slotEntries: new Map(),
        quest: null,
        pendingClarification: null,
        isStreaming: false,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('quest-modified handling', () => {
    it('VALID: {quest-modified for matching questId} => sets quest', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-mod-1' });
      const quest = QuestStub({ id: questId });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-mod-1', quest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        slotEntries: new Map(),
        quest,
        pendingClarification: null,
        isStreaming: false,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });

    it('EDGE: {quest-modified for different questId} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-mine' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: {
                questId: 'quest-other',
                quest: QuestStub({ id: QuestIdStub({ value: 'quest-other' }) }),
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        slotEntries: new Map(),
        quest: null,
        pendingClarification: null,
        isStreaming: false,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('chat-history-complete handling', () => {
    it('VALID: {chat-history-complete after chat-output} => sets isStreaming to false', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-hist-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-hist-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-h' }),
                entries: [{ role: 'assistant', type: 'text', content: 'replay' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-history-complete',
              payload: { chatProcessId: ProcessIdStub({ value: 'proc-h' }) },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('clarification-request handling', () => {
    it('VALID: {clarification-request} => sets pendingClarification', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-clarify-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'clarification-request',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-c' }),
                questions: [
                  {
                    question: 'Which DB?',
                    header: 'Database',
                    options: [{ label: 'Postgres', description: 'Relational' }],
                    multiSelect: false,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.pendingClarification).toStrictEqual({
        questions: [
          {
            question: 'Which DB?',
            header: 'Database',
            options: [{ label: 'Postgres', description: 'Relational' }],
            multiSelect: false,
          },
        ],
      });
    });
  });

  describe('sendMessage', () => {
    it('VALID: {questId, message} => appends user entry, sets isStreaming, posts to questChat', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-send-1' });
      const message = UserInputStub({ value: 'Hi' });
      const synthUuid = '00000000-0000-4000-8000-00000000000a';
      const synthTs = '2025-01-01T00:00:00.000Z';
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-send' }) });
      proxy.setupUuids({ uuids: [synthUuid] });
      proxy.setupTimestamps({ timestamps: [synthTs] });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      const synthKey = '__no_session__' as ReturnType<typeof SessionIdStub>;
      const expectedMap = new Map();
      expectedMap.set(synthKey, [
        { role: 'user', content: 'Hi', uuid: synthUuid, timestamp: synthTs },
      ]);

      expect(result.current).toStrictEqual({
        entriesBySession: expectedMap,
        slotEntries: new Map(),
        quest: null,
        pendingClarification: null,
        isStreaming: true,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('cleanup', () => {
    it('EDGE: {unmount with active questId} => sends unsubscribe-quest then closes WS', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-unmount-1' });

      const { unmount } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          unmount();
        },
      });

      const sentMessages = proxy.getSentWsMessages();
      const closeMock = proxy.getSocketClose();

      expect(sentMessages).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-unmount-1' },
        { type: 'unsubscribe-quest', questId: 'quest-unmount-1' },
      ]);
      expect(closeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('sendMessage pause→resume', () => {
    it('VALID: {quest paused} => resumes quest before posting chat', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-pause-resume-1' });
      const message = UserInputStub({ value: 'Hello after pause' });
      const pausedQuest = QuestStub({ id: questId, status: 'paused' });
      proxy.setupResume({ restoredStatus: 'in_progress' });
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-pr' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-pause-resume-1', quest: pausedQuest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect({
        resume: proxy.getResumeRequestCount(),
        chat: proxy.getChatRequestCount(),
      }).toStrictEqual({ resume: 1, chat: 1 });
    });

    it('EDGE: {quest paused, resume fails} => chat is not invoked because resume promise rejects first', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-pause-resume-2' });
      const message = UserInputStub({ value: 'Hello after pause' });
      const pausedQuest = QuestStub({ id: questId, status: 'paused' });
      proxy.setupChat({ chatProcessId: ProcessIdStub({ value: 'proc-pr-2' }) });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'quest-modified',
              payload: { questId: 'quest-pause-resume-2', quest: pausedQuest },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.sendMessage({ message });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect({
        resume: proxy.getResumeRequestCount(),
        chat: proxy.getChatRequestCount(),
      }).toStrictEqual({ resume: 1, chat: 0 });
    });
  });

  describe('chat-complete handling', () => {
    it('VALID: {chat-complete after chat-output} => sets isStreaming to false', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-complete-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-complete-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-cc' }),
                entries: [{ role: 'assistant', type: 'text', content: 'streaming' }],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-complete',
              payload: {
                chatProcessId: ProcessIdStub({ value: 'proc-cc' }),
                exitCode: 0,
                sessionId: SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' }),
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe('submitClarifyAnswers', () => {
    it('VALID: {questions, answers} => POSTs to questClarify endpoint once', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-clarify-submit-1' });
      proxy.setupClarify({ chatProcessId: ProcessIdStub({ value: 'proc-clar' }) });
      const stub = AskUserQuestionStub();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.submitClarifyAnswers({
            questions: stub.questions,
            answers: [{ header: 'Preference', label: 'Option A' }],
          });
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(result.current.isStreaming).toBe(true);
    });
  });

  describe('stopChat', () => {
    it('VALID: {questId set} => POSTs to questPause endpoint once', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-stop-1' });
      proxy.setupPause();

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      await testingLibraryActAsyncAdapter({
        callback: async () => {
          result.current.stopChat();
          await new Promise((resolve) => {
            globalThis.setTimeout(resolve, 0);
          });
        },
      });

      expect(proxy.getPauseRequestCount()).toBe(1);
    });
  });

  describe('chat-output without sessionId', () => {
    it('VALID: {chat-output sans sessionId} => buckets entries under synthetic __no_session__ key', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-nosession-1' });
      const entryUuid = '00000000-0000-4000-8000-000000000099';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-nosession-1',
                workItemId: QuestWorkItemIdStub(),
                chatProcessId: ProcessIdStub({ value: 'proc-ns' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'no-sess',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const synthKey = '__no_session__' as ReturnType<typeof SessionIdStub>;
      const expectedMap = new Map();
      expectedMap.set(synthKey, [
        {
          role: 'assistant',
          type: 'text',
          content: 'no-sess',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);

      expect(result.current.entriesBySession).toStrictEqual(expectedMap);
    });
  });

  describe('invalid messages', () => {
    it('EDGE: {invalid WS message shape} => is ignored', () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-bad-1' });

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({ not: 'valid' }),
          });
        },
      });

      expect(result.current).toStrictEqual({
        entriesBySession: new Map(),
        slotEntries: new Map(),
        quest: null,
        pendingClarification: null,
        isStreaming: false,
        sendMessage: expect.any(Function),
        submitClarifyAnswers: expect.any(Function),
        stopChat: expect.any(Function),
      });
    });
  });

  describe('reconnect', () => {
    it('VALID: {WS closes and reconnects} => re-sends subscribe-quest and post-reconnect chat-output updates state', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId = QuestIdStub({ value: 'quest-reconnect-1' });
      const sessionId = SessionIdStub({ value: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' });
      const entryUuid = '00000000-0000-4000-8000-000000000042';
      const entryTs = '2025-01-01T00:00:00.000Z';

      const { result } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId }),
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
      ]);

      testingLibraryActAdapter({
        callback: () => {
          proxy.triggerWsClose();
          proxy.markFirstWsSocketClosed();
          proxy.triggerWsReconnect();
          proxy.triggerWsOpen();
          proxy.markFirstWsSocketClosed();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
            { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
          ]);
        },
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
        { type: 'subscribe-quest', questId: 'quest-reconnect-1' },
      ]);

      testingLibraryActAdapter({
        callback: () => {
          proxy.receiveWsMessage({
            data: JSON.stringify({
              type: 'chat-output',
              payload: {
                questId: 'quest-reconnect-1',
                workItemId: QuestWorkItemIdStub(),
                sessionId,
                chatProcessId: ProcessIdStub({ value: 'proc-reconnect' }),
                entries: [
                  {
                    role: 'assistant',
                    type: 'text',
                    content: 'post-reconnect',
                    uuid: entryUuid,
                    timestamp: entryTs,
                  },
                ],
              },
              timestamp: '2025-01-01T00:00:00.000Z',
            }),
          });
        },
      });

      const expectedMap = new Map();
      expectedMap.set(sessionId, [
        {
          role: 'assistant',
          type: 'text',
          content: 'post-reconnect',
          uuid: entryUuid,
          timestamp: entryTs,
        },
      ]);

      expect(result.current.entriesBySession).toStrictEqual(expectedMap);
    });
  });

  describe('questId change', () => {
    it('VALID: {questId changes while mounted} => sends unsubscribe-quest then subscribe-quest for new id', async () => {
      const proxy = useQuestChatBindingProxy();
      const questId1 = QuestIdStub({ value: 'quest-change-old' });
      const questId2 = QuestIdStub({ value: 'quest-change-new' });

      let activeQuestId = questId1;

      const { rerender } = testingLibraryRenderHookAdapter({
        renderCallback: () => useQuestChatBinding({ questId: activeQuestId }),
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            { type: 'subscribe-quest', questId: 'quest-change-old' },
          ]);
        },
      });

      testingLibraryActAdapter({
        callback: () => {
          activeQuestId = questId2;
          rerender();
        },
      });

      await testingLibraryWaitForAdapter({
        callback: () => {
          expect(proxy.getSentWsMessages()).toStrictEqual([
            { type: 'subscribe-quest', questId: 'quest-change-old' },
            { type: 'unsubscribe-quest', questId: 'quest-change-new' },
            { type: 'subscribe-quest', questId: 'quest-change-new' },
          ]);
        },
      });

      expect(proxy.getSentWsMessages()).toStrictEqual([
        { type: 'subscribe-quest', questId: 'quest-change-old' },
        { type: 'unsubscribe-quest', questId: 'quest-change-new' },
        { type: 'subscribe-quest', questId: 'quest-change-new' },
      ]);
    });
  });
});
